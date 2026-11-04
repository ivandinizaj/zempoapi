import { getValidSiglas, isValidEstadoSigla } from "../utils/estadoMapper";
import {
  ATHLETE_EDIT_FIELDS,
  ATHLETE_EDIT_KEYS,
  fieldType,
  isAthleteEditKey,
  type AthleteEditKey,
} from "../domain/athleteEdit/fields";
import { isNumericId, parseAthleteId } from "../utils/coding";
import type { AthleteUpdateInput } from "../types";

export const ATHLETE_ID_REGEX = /^\d+$/;
export const ATHLETE_CODIGO_REGEX = /^JU\d+$/i;
export const VALID_ORDEM = ["DESC", "ASC", ""] as const;

export function validateAthleteId(id: string): string | null {
  return ATHLETE_ID_REGEX.test(id)
    ? null
    : "O ID deve ser numérico. Para busca por código use /api/atleta/codigo/JU079588";
}

export function validateAtletaCodigo(codigo: string): string | null {
  return ATHLETE_CODIGO_REGEX.test(codigo)
    ? null
    : "Código inválido. Use o formato JU seguido de números (ex: JU079588)";
}

export function validatePagina(pagina: number): string | null {
  return pagina >= 1 ? null : "O parâmetro pagina deve ser maior ou igual a 1";
}

export function validateOrdem(ordem: string): string | null {
  return VALID_ORDEM.includes(ordem as (typeof VALID_ORDEM)[number])
    ? null
    : "O parâmetro ordem deve ser 'DESC' ou omitido (crescente por padrão)";
}

export function validateFiltroEstado(filtro: string): string | null {
  if (isValidEstadoSigla(filtro)) return null;
  return `Sigla de estado inválida. Use uma das siglas: ${getValidSiglas().join(", ")}`;
}

export function validateClubId(id: string): string | null {
  if (isNumericId(id)) return null;
  if (/^CL\d+$/i.test(id)) return null;
  return "ID inválido. Use o ID numérico (ex: 2294) ou o código do clube (ex: CL002294)";
}

export function validateCidadeId(id: string): string | null {
  return isNumericId(id) ? null : "O ID da cidade deve ser numérico (ex: 5406)";
}

/** Aceita exatamente o que `parseAthleteId` converte — a rota pode confiar no resultado. */
export function validateAthleteIdOrCodigo(raw: string): string | null {
  return parseAthleteId(raw)
    ? null
    : "ID inválido. Use o ID numérico (ex: 79588) ou o código do atleta (ex: JU079588)";
}

/** Valida formato do body do PATCH /atleta/:id (sem consultar o ZEMPO). */
export function validateAthleteUpdateBody(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return 'Envie um objeto JSON com os campos a alterar (ex: { "celular": "(81)99999-0000" })';
  }
  const entries = Object.entries(body as Record<string, unknown>);
  if (entries.length === 0) return "Nenhum campo informado para atualização";

  const unknown = entries.map(([k]) => k).filter((k) => !isAthleteEditKey(k));
  if (unknown.length) {
    return `Campos não editáveis ou desconhecidos: ${unknown.join(", ")}. Editáveis: ${ATHLETE_EDIT_KEYS.join(", ")}`;
  }

  const errors: string[] = [];
  for (const [key, raw] of entries as [AthleteEditKey, unknown][]) {
    const type = fieldType(key);
    if (raw === null || raw === "") {
      if (!type.clearable) errors.push(`${key}: não pode ser vazio`);
      continue;
    }
    if (typeof raw !== "string" && typeof raw !== "number") {
      errors.push(`${key}: valor deve ser texto, número ou null (para limpar)`);
      continue;
    }
    const err = type.validate(String(raw).trim());
    if (err) errors.push(`${key}: ${err}`);
  }

  // cidade/bairro são listas dependentes do estado/cidade (como no formulário do ZEMPO)
  if ("estado" in body && !("cidade" in body && "bairro" in body)) {
    errors.push("estado: ao alterar o estado informe também cidade e bairro");
  } else if ("cidade" in body && !("bairro" in body)) {
    errors.push("cidade: ao alterar a cidade informe também o bairro");
  }

  return errors.length ? errors.join("; ") : null;
}

/** Impede limpar (null/"") campos que o ZEMPO marca como obrigatórios. */
export function validateRequiredEditFields(
  input: AthleteUpdateInput,
  obrigatorios: string[],
): string | null {
  const faltando = (Object.entries(input) as [AthleteEditKey, string][])
    .filter(([key, value]) => {
      const { campo } = ATHLETE_EDIT_FIELDS[key];
      return value === "" && campo !== null && obrigatorios.includes(campo);
    })
    .map(([key]) => key);
  return faltando.length
    ? `Campos obrigatórios não podem ser vazios: ${faltando.join(", ")}`
    : null;
}
