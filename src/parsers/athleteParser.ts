import * as cheerio from "cheerio";
import type { Athlete, Parsed } from "../types";
import { resolveAbsoluteUrl } from "../utils/url";
import { parseCodigo } from "../utils/coding";
import { buildPageIndex, type CheerioAPI, type PageIndex } from "./parserUtils";

function extractIds(html: string): { id: string | null; codigo: string | null } {
  const match = html.match(/#(JU\d+)/);
  if (!match) return { id: null, codigo: null };
  const parsed = parseCodigo(match[1]);
  return parsed ?? { id: null, codigo: null };
}

function extractPhoto($: CheerioAPI, baseUrl: string): string | null {
  return resolveAbsoluteUrl($("#foto_principal").attr("src"), baseUrl);
}

function extractGraduacao(
  index: PageIndex,
  $: CheerioAPI,
): { graduacao: string | null; dataGraduacao: string | null } {
  const td = index.tds.find((t) => t.lower === "graduação" && t.isAzul);
  const graduacao = td?.next?.spanFonte13 ?? td?.next?.imgGraduacaoAlt ?? null;

  const dataInput = ($("input#graduacao_data").val() ??
    $("input[name=graduacao_data]").val()) as string | undefined;
  const dataGraduacao =
    (dataInput || index.labels.get("data da última graduação")) ?? null;

  return { graduacao, dataGraduacao };
}

function extractFederacaoClube(index: PageIndex): {
  federacao: string | null;
  registroFederacao: string | null;
  clube: string | null;
} {
  let federacao: string | null = null;
  let registroFederacao: string | null = null;
  let clube: string | null = null;

  for (const td of index.tds) {
    if (td.lower === "federação" && td.isAzul && td.next) {
      const siglaMatch = td.next.text.match(/^([A-Z]+)\s*-\s*([A-Z]{2})/);
      if (siglaMatch) federacao = `${siglaMatch[1]} - ${siglaMatch[2]}`;
      const regMatch = td.next.text.match(/Registro em:\s*([\d/]+)/);
      if (regMatch) registroFederacao = regMatch[1];
    }
    if (td.lower === "clube" && td.isAzul && td.next) {
      clube = td.next.text;
    }
  }

  return { federacao, registroFederacao, clube };
}

function extractPesoCategoria(
  $: CheerioAPI,
  index: PageIndex,
): { peso: string | null; categoria: string | null } {
  const categoria = $("#categoria_label").text().trim() || null;

  let peso: string | null = null;
  for (const td of index.tds) {
    const m = td.text.match(/^([\d.,]+)\s*kg/);
    if (m) { peso = m[0]; break; }
  }

  return { peso, categoria };
}

function extractSituacao(
  index: PageIndex,
): { federacao: string | null; cbj: string | null } {
  const td = index.tds.find((t) => t.lower === "situação" && t.isAzul);
  if (!td?.next) return { federacao: null, cbj: null };

  const fedMatch = td.next.text.match(/Federa[çc][aã]o\s+(\w+)/i);
  const cbjMatch = td.next.text.match(/CBJ\s+(\w+)/i);

  return {
    federacao: fedMatch ? fedMatch[1] : null,
    cbj: cbjMatch ? cbjMatch[1] : null,
  };
}

function extractBirthInfo(
  index: PageIndex,
): { dataNascimento: string | null; idade: number | null } {
  for (const td of index.tds) {
    const m = td.text.match(/^(\d{2}\/\d{2}\/\d{4})\s+\((\d+)\s+anos?\)/);
    if (m) return { dataNascimento: m[1], idade: parseInt(m[2]) };
  }
  return { dataNascimento: null, idade: null };
}

function extractEmailCelular(
  index: PageIndex,
): { email: string | null; celular: string | null } {
  let email: string | null = null;
  let celular: string | null = null;

  for (const td of index.tds) {
    if (!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(td.text)) email = td.text;
    if (!celular && /^\(\d{2}\)\d{4,5}-\d{4}$/.test(td.text)) celular = td.text;
    if (email && celular) break;
  }

  return { email, celular };
}

function extractTelefoneResidencial(index: PageIndex): string | null {
  const td = index.tds.find(
    (t) => t.lower.includes("telefone residencial") && t.isAzul,
  );
  return td?.next?.text ?? null;
}

function extractGenero(index: PageIndex): "masculino" | "feminino" | null {
  for (const td of index.tds) {
    if (td.lower.includes("masculino")) return "masculino";
    if (td.lower.includes("feminino")) return "feminino";
  }
  return null;
}

export function parseUserData(html: string, baseUrl = "https://zempo.com.br"): Parsed<Athlete> {
  const $ = cheerio.load(html);
  const index = buildPageIndex($);

  const { id, codigo } = extractIds(html);
  const { graduacao, dataGraduacao } = extractGraduacao(index, $);
  const { federacao, registroFederacao, clube } = extractFederacaoClube(index);
  const { peso, categoria } = extractPesoCategoria($, index);
  const situacao = extractSituacao(index);
  const { dataNascimento, idade } = extractBirthInfo(index);
  const { email, celular } = extractEmailCelular(index);

  return {
    id,
    codigo,
    nomeCompleto: index.labels.get("nome completo") ?? null,
    primeiroNome: index.labels.get("primeiro nome") ?? null,
    ultimoNome: index.labels.get("último nome") ?? null,

    federacao,
    registroFederacao,
    clube,

    graduacao,
    dataUltimaGraduacao: dataGraduacao,

    genero: extractGenero(index),
    dataNascimento,
    idade,
    nacionalidade: index.labels.get("nacionalidade") ?? null,
    naturalidade: index.labels.get("naturalidade") ?? null,

    peso,
    categoria,
    classe: $("#classe_label").text().trim() || null,

    situacaoFederacao: situacao.federacao,
    situacaoCBJ: situacao.cbj,
    status: index.labels.get("status") ?? null,
    selecaoBrasileira: index.labels.get("seleção brasileira") ?? null,

    email,
    celular,
    telefone: extractTelefoneResidencial(index),
    emailTecnico: index.labels.get("email do técnico") ?? null,

    cpf: index.labels.get("cpf") ?? null,
    foto: extractPhoto($, baseUrl),

    _parsedAt: new Date().toISOString(),
  };
}
