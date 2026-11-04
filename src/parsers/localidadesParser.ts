import * as cheerio from "cheerio";
import type { LocalidadeList, Parsed } from "../types";
import { normalizeText } from "../utils/text";
import { isNumericId } from "../utils/coding";

/**
 * Lê as `<option>` retornadas por retorno_cidades.php / retorno_bairros.php.
 * Ignora a opção vazia inicial.
 */
export function parseLocalidades(html: string): Parsed<LocalidadeList> {
  const $ = cheerio.load(html);
  const itens = $("option")
    .map((_, opt) => ({ id: $(opt).attr("value") ?? "", nome: normalizeText($(opt).text()) }))
    .get()
    .filter((o) => isNumericId(o.id) && o.nome !== "");
  return { itens, _parsedAt: new Date().toISOString() };
}
