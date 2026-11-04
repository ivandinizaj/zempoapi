import atletasCache from "../cache/atletasCache";
import { fetchPage, postForm, postPage, BASE_URL } from "../http/zempoClient";
import { extractAviso, parseAthleteEditForm } from "../parsers/athleteEditParser";
import {
  ATHLETE_EDIT_FIELDS,
  fieldType,
  isEnderecoPart,
  type AthleteEditKey,
} from "../domain/athleteEdit/fields";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ZempoRejectedError,
} from "../errors/AppError";
import { validateRequiredEditFields } from "../validators";
import { isNumericId } from "../utils/coding";
import { getEntryValue } from "../utils/formEntries";
import { joinEndereco, normalizeNome } from "../utils/format";
import { createKeyedLock } from "../utils/keyedLock";
import { buildMultipartLatin1 } from "../utils/multipart";
import logger from "../utils/logger";
import { getBairros, getCidades } from "./localidadesService";
import type {
  AthleteEditForm,
  AthleteEditView,
  AthleteUpdateInput,
  AthleteUpdateResult,
  Localidade,
  Parsed,
  ServiceResult,
} from "../types";

// Formulário de edição não é cacheado: contém dados pessoais e precisa estar
// fresco antes de cada atualização (o POST reenvia todos os campos).

// O update lê o formulário e reenvia todos os campos: dois updates simultâneos no
// mesmo atleta fariam o segundo sobrescrever o primeiro com valores antigos.
const withAthleteLock = createKeyedLock();

async function loadEditForm(id: string): Promise<Parsed<AthleteEditForm>> {
  const html = await fetchPage(`${BASE_URL}/index.php?secao=pessoas_editar&id=${id}`);
  const form = parseAthleteEditForm(html);
  if (!form) {
    throw new NotFoundError(
      `Formulário de edição do atleta ${id} não encontrado (ID inexistente ou sem permissão de edição)`,
    );
  }
  // Sem permissão o ZEMPO ainda renderiza o formulário, mas vazio (sem o nome do atleta).
  if (!form.nomeCompleto) {
    throw new ForbiddenError(`Você não tem permissão para editar os dados do atleta ${id}`);
  }
  return form;
}

/** Dados editáveis atuais, no mesmo formato aceito por `updateAthleteProfile`. */
export async function getAthleteEditData(id: string): Promise<ServiceResult<AthleteEditView>> {
  const form = await loadEditForm(id);
  return {
    data: { id, nomeCompleto: form.nomeCompleto, dados: form.dados },
    cached: false,
    _parsedAt: form._parsedAt,
  };
}

/**
 * Aplica as alterações (já validadas e normalizadas) no cadastro do atleta:
 * lê o formulário atual, resolve localidades e categoria, envia e confere o resultado.
 */
export function updateAthleteProfile(
  id: string,
  input: AthleteUpdateInput,
): Promise<ServiceResult<AthleteUpdateResult>> {
  return withAthleteLock(id, async () => {
    const form = await loadEditForm(id);

    const reqErr = validateRequiredEditFields(input, form.obrigatorios);
    if (reqErr) throw new ValidationError(reqErr);

    const { changes, erros } = await resolveAthleteChanges(form, input);
    if (erros.length) throw new ValidationError(erros.join("; "));

    const categoriaId = await resolveCategoriaId(form, input.peso);
    if (categoriaId !== null) changes.categoria = categoriaId;

    const result = await submitForm(id, form, input, changes);
    if (!result.data.sucesso) {
      throw new ZempoRejectedError(
        result.data.mensagem ?? "O ZEMPO não confirmou a atualização do atleta",
      );
    }
    return result;
  });
}

/** Campos que o `retorno_categorias.php` usa para decidir a categoria (classe, classe2..classe15). */
const CATEGORIA_PARAMS = [
  "sexo",
  "classe",
  ...Array.from({ length: 14 }, (_, i) => `classe${i + 2}`),
  "federacao",
  "graduacao",
];

/**
 * Replica o `$("#peso").change` da página: pergunta ao ZEMPO qual categoria
 * corresponde ao novo peso. Retorna null se o peso não mudou.
 */
async function resolveCategoriaId(
  form: AthleteEditForm,
  peso: string | undefined,
): Promise<string | null> {
  if (!peso || peso === form.dados.peso) return null;

  const params: Record<string, string> = { peso };
  for (const name of CATEGORIA_PARAMS) params[name] = getEntryValue(form.entries, name);

  const raw = await postForm(`${BASE_URL}/retorno_categorias.php`, params);

  const [catId = "", nome] = raw.trim().split("&");
  if (!nome?.trim() || !isNumericId(catId)) {
    throw new ValidationError(`peso: nenhuma categoria encontrada para ${peso} kg`);
  }
  return catId;
}

/** Encontra pelo ID ZEMPO ou pelo nome (sem acento/caixa). */
function findLocalidade(itens: Localidade[], valor: string): Localidade | null {
  if (isNumericId(valor)) return itens.find((i) => i.id === valor) ?? null;
  const alvo = normalizeNome(valor);
  return itens.find((i) => normalizeNome(i.nome) === alvo) ?? null;
}

/**
 * Converte as alterações da API para os campos do ZEMPO: cada tipo via `toForm`,
 * cidade/bairro por nome → ID (consultando as listas do ZEMPO), endereço + número → "Rua X, 45".
 * Retorna `erros` quando cidade/bairro não existem.
 */
export async function resolveAthleteChanges(
  form: AthleteEditForm,
  input: AthleteUpdateInput,
): Promise<{ changes: Record<string, string>; erros: string[] }> {
  const changes: Record<string, string> = {};
  const erros: string[] = [];

  for (const [key, value] of Object.entries(input) as [AthleteEditKey, string][]) {
    const { campo } = ATHLETE_EDIT_FIELDS[key];
    const type = fieldType(key);
    if (campo === null || isEnderecoPart(key) || type.lookup) continue;
    changes[campo] = value === "" ? "" : type.toForm(value);
  }

  if (input.endereco !== undefined || input.numero !== undefined) {
    const endereco = input.endereco ?? form.dados.endereco;
    const numero = input.numero ?? form.dados.numero;
    changes.endereco = joinEndereco(endereco, numero);
  }

  let cidadeId = form.cidadeId;
  if (input.cidade !== undefined) {
    const uf = input.estado ?? form.dados.estado;
    const cidades = uf ? (await getCidades(uf)).data : [];
    const cidade = findLocalidade(cidades, input.cidade);
    if (cidade) {
      cidadeId = cidade.id;
      changes.cidade = cidade.id;
    } else {
      erros.push(`cidade: "${input.cidade}" não encontrada em ${uf ?? "estado não informado"}`);
    }
  }

  if (input.bairro !== undefined && cidadeId && !erros.length) {
    const bairros = (await getBairros(cidadeId)).data;
    const bairro = findLocalidade(bairros, input.bairro);
    if (bairro) {
      changes.bairro = bairro.id;
    } else {
      const sugestoes = bairros
        .slice(0, 10)
        .map((b) => b.nome)
        .join(", ");
      erros.push(
        `bairro: "${input.bairro}" não encontrado na cidade. Consulte /localidades/cidades/${cidadeId}/bairros (ex: ${sugestoes})`,
      );
    }
  }

  return { changes, erros };
}

/** Reenvia o formulário com `changes` aplicadas e lê o que o ZEMPO salvou. */
async function submitForm(
  id: string,
  form: AthleteEditForm,
  input: AthleteUpdateInput,
  changes: Record<string, string>,
): Promise<ServiceResult<AthleteUpdateResult>> {
  const entries = form.entries.map((e) =>
    Object.hasOwn(changes, e.name) ? { ...e, value: changes[e.name] } : e,
  );

  const html = await postPage(
    `${BASE_URL}/?secao=pessoas_editar&acao=atualizar&id=${id}`,
    buildMultipartLatin1(entries),
  );

  atletasCache.invalidate(id);

  const mensagem = extractAviso(html);
  if (!mensagem) {
    // sem o HTML no log: ele contém dados pessoais do atleta
    logger.warn(
      { id, htmlLength: html.length },
      "[AthleteEdit] Aviso do ZEMPO não encontrado após o POST",
    );
  }
  const updated = parseAthleteEditForm(html);
  const naoAplicados = updated
    ? (Object.entries(input) as [AthleteEditKey, string][])
        .filter(
          ([key, sent]) => !fieldType(key).equals(sent.trim(), (updated.dados[key] ?? "").trim()),
        )
        .map(([key]) => key)
    : [];

  return {
    data: {
      sucesso: /sucesso/i.test(mensagem ?? ""),
      mensagem,
      naoAplicados,
      dados: updated?.dados ?? null,
    },
    cached: false,
    _parsedAt: updated?._parsedAt ?? new Date().toISOString(),
  };
}
