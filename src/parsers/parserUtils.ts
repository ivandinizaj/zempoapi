import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { normalizeText } from "../utils/text";

export type CheerioAPI = ReturnType<typeof cheerio.load>;

export interface TdSnapshot {
  text: string;
  lower: string;
  isAzul: boolean;
  next: {
    text: string;
    spanFonte13: string | null;
    imgGraduacaoAlt: string | null;
  } | null;
}

export interface PageIndex {
  tds: TdSnapshot[];
  /** First occurrence of each label (lowercased) → next td text */
  labels: Map<string, string>;
}

export function hasAzul($: CheerioAPI, el: AnyNode): boolean {
  const $el = $(el);
  return $el.hasClass("azul") || $el.find(".azul").length > 0;
}

/**
 * Single-pass td collection. Replaces all individual $("td").each() calls in
 * the athlete parser: builds a pre-indexed snapshot used by every extractor.
 */
export function buildPageIndex($: CheerioAPI): PageIndex {
  const tds: TdSnapshot[] = [];
  const labels = new Map<string, string>();

  $("td").each((_, el) => {
    const $el = $(el);
    const text = normalizeText($el.text());
    const lower = text.toLowerCase();
    const $next = $el.next("td");

    let next: TdSnapshot["next"] = null;
    if ($next.length) {
      const nextText = normalizeText($next.text());
      next = {
        text: nextText,
        spanFonte13: normalizeText($next.find("span.fonte13").text()) || null,
        imgGraduacaoAlt: ($next.find("img[src*='graduacoes']").attr("alt") ?? "").trim() || null,
      };
      if (!labels.has(lower)) labels.set(lower, nextText);
    } else {
      const rowNext = $el
        .closest("tr")
        .find("td")
        .eq($el.index() + 1);
      if (rowNext.length && !labels.has(lower)) {
        labels.set(lower, normalizeText(rowNext.text()));
      }
    }

    tds.push({ text, lower, isAzul: hasAzul($, el), next });
  });

  return { tds, labels };
}
