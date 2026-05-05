import * as cheerio from "cheerio";
import type { ClubDetails, Parsed } from "../types";
import { buildPageIndex, type PageIndex } from "./parserUtils";

function extractCodigo(html: string): string | null {
  const m = html.match(/#(CL\d+)/);
  return m ? m[1] : null;
}

function extractField(index: PageIndex, key: string): string | null {
  const td = index.tds.find((t) => t.lower === key && t.isAzul);
  return td?.next?.text || null;
}

function extractSigla(index: PageIndex): string | null {
  const raw = extractField(index, "sigla");
  if (!raw) return null;
  // Valor vem como "4BL Abreviação4BL" — remove o hint embutido pelo ZEMPO
  return raw.replace(/\s*abrevia[çc][aã]o.*/i, "").trim() || null;
}

function extractFederado(index: PageIndex): boolean | null {
  const raw = extractField(index, "federado");
  if (raw === null) return null;
  return raw.toLowerCase().startsWith("sim");
}

export function parseClubDetails(html: string): Parsed<ClubDetails> {
  const $ = cheerio.load(html);
  const index = buildPageIndex($);

  return {
    codigo: extractCodigo(html),
    nome: extractField(index, "nome"),
    sigla: extractSigla(index),
    federacao: extractField(index, "federação"),
    cnpj: extractField(index, "cnpj"),
    email: extractField(index, "email"),
    website: extractField(index, "website"),
    federado: extractFederado(index),
    telefone: extractField(index, "telefone"),
    status: extractField(index, "status"),
    cep: extractField(index, "cep"),
    endereco: extractField(index, "endereço"),
    estado: extractField(index, "estado"),
    bairro: extractField(index, "bairro"),
    complemento: extractField(index, "complemento"),
    cidade: extractField(index, "cidade"),
    facebook: extractField(index, "facebook"),
    instagram: extractField(index, "instagram"),
    whatsapp: extractField(index, "whatsapp"),
    twitter: extractField(index, "twitter"),
    youtube: extractField(index, "youtube"),
    _parsedAt: new Date().toISOString(),
  };
}
