import * as cheerio from "cheerio";
import type { Club, ClubsPage, Parsed } from "../types";
import { resolveAbsoluteUrl } from "../utils/url";
import { normalizeText } from "../utils/text";
import type { CheerioAPI } from "./parserUtils";

function extractTotal($: CheerioAPI): number {
  let total = 0;
  $("td").each((_: number, el: any) => {
    const m = $(el)
      .text()
      .trim()
      .match(/^(\d+)\s+clube\(s\)/);
    if (m) {
      total = parseInt(m[1], 10);
      return false;
    }
  });
  return total;
}

export function parseClubesData(
  html: string,
  baseUrl = "https://zempo.com.br",
): Parsed<ClubsPage> {
  const $ = cheerio.load(html);
  const total = extractTotal($);
  const clubes: Club[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $("tr[onmouseover*='setPointer']").each((_: number, row: any) => {
    const tds = $(row).find("td");
    if (tds.length < 7) return;

    const texto = (i: number): string | null =>
      normalizeText($(tds[i]).text()) || null;

    clubes.push({
      foto: resolveAbsoluteUrl($(tds[0]).find("img").attr("src"), baseUrl),
      codigo: texto(1),
      nome: texto(2),
      telefone: texto(3),
      email: texto(4),
      federacao: texto(5),
      estado: texto(6),
    });
  });

  return { clubes, total, pagina: 1, _parsedAt: new Date().toISOString() };
}
