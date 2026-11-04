import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type {
  AthleteEditData,
  AthleteEditForm,
  EditFormEntry,
  EditFormOption,
  Parsed,
} from "../types";
import { normalizeText } from "../utils/text";
import {
  ATHLETE_EDIT_FIELDS,
  ATHLETE_EDIT_KEYS,
  fieldType,
  isEnderecoPart,
  type AthleteEditKey,
} from "../domain/athleteEdit/fields";
import { getEntryValue } from "../utils/formEntries";
import { splitEndereco } from "../utils/format";
import type { CheerioAPI } from "./parserUtils";

/**
 * Recorta apenas o `<form id="formulario">…</form>` da página — evita carregar
 * no cheerio as ~200KB de menu, scripts e estilos que vêm junto.
 */
export function extractFormHtml(html: string): string | null {
  const start = html.search(/<form\b[^>]*id=["']formulario["']/i);
  if (start === -1) return null;
  const end = html.indexOf("</form>", start);
  return end === -1 ? html.slice(start) : html.slice(start, end + "</form>".length);
}

/** Lê o aviso exibido pelo ZEMPO após o POST (ex: "Atleta atualizado com sucesso!"). */
export function extractAviso(html: string): string | null {
  const m = html.match(/<div[^>]*class=["']aviso\d*[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!m) return null;
  const text = normalizeText(m[1].replace(/<[^>]+>/g, " "));
  return text || null;
}

function extractId(html: string): string | null {
  return html.match(/acao=atualizar(?:&amp;|&)id=(\d+)/)?.[1] ?? null;
}

function extractNomeCompleto($: CheerioAPI): string | null {
  const td = $("td")
    .filter((_, el) => normalizeText($(el).text()) === "Nome Completo")
    .first();
  const value = normalizeText(td.next("td").text());
  return value || null;
}

/** Valor que o navegador submeteria para um select: o selecionado ou, na falta, o primeiro. */
function selectedOption($: CheerioAPI, el: Element): EditFormOption | null {
  const opt = $(el).find("option[selected]").last();
  const chosen = opt.length ? opt : $(el).find("option").first();
  if (!chosen.length) return null;
  const label = normalizeText(chosen.text());
  return { value: chosen.attr("value") ?? label, label };
}

/**
 * Serializa o formulário como o navegador faria no submit: mesma ordem,
 * nomes duplicados preservados, ignora disabled e checkbox/radio desmarcados.
 */
function collectEntries($: CheerioAPI): EditFormEntry[] {
  const entries: EditFormEntry[] = [];
  $("#formulario")
    .find("input, select, textarea")
    .each((_, el) => {
      const $el = $(el);
      const name = $el.attr("name");
      if (!name || $el.attr("disabled") !== undefined) return;

      const tag = el.tagName.toLowerCase();
      const type = ($el.attr("type") ?? "text").toLowerCase();

      if (tag === "select") {
        entries.push({ name, value: selectedOption($, el)?.value ?? "", isFile: false });
      } else if (tag === "textarea") {
        entries.push({ name, value: $el.text(), isFile: false });
      } else if (type === "file") {
        entries.push({ name, value: "", isFile: true });
      } else if (type === "image") {
        entries.push({ name: `${name}.x`, value: "1", isFile: false });
        entries.push({ name: `${name}.y`, value: "1", isFile: false });
      } else if (type === "checkbox" || type === "radio") {
        if ($el.attr("checked") !== undefined) {
          entries.push({ name, value: $el.attr("value") ?? "on", isFile: false });
        }
      } else if (type !== "submit" && type !== "button" && type !== "reset") {
        entries.push({ name, value: $el.attr("value") ?? "", isFile: false });
      }
    });
  return entries;
}

const PLACEHOLDER_REGEX = /^-+$/;

/** Converte os valores crus do formulário para o formato da API. */
function collectDados($: CheerioAPI, entries: EditFormEntry[]): AthleteEditData {
  const label = (campo: string) => {
    const el = $(`#formulario select[name="${campo}"]`).get(0);
    const opt = el ? selectedOption($, el) : null;
    return opt && opt.value !== "" && opt.value !== "0" && !PLACEHOLDER_REGEX.test(opt.label)
      ? opt.label
      : null;
  };

  const dados = {} as Record<AthleteEditKey, string | null>;
  for (const key of ATHLETE_EDIT_KEYS) {
    const { campo } = ATHLETE_EDIT_FIELDS[key];
    if (campo === null || isEnderecoPart(key)) continue;
    dados[key] = fieldType(key).fromForm(getEntryValue(entries, campo), label(campo));
  }

  const { endereco, numero } = splitEndereco(getEntryValue(entries, "endereco") || null);
  return { ...dados, endereco, numero };
}

function collectObrigatorios($: CheerioAPI): string[] {
  return $("#formulario [name]")
    .filter((_, el) => /validate\[[^\]]*required/.test($(el).attr("class") ?? ""))
    .map((_, el) => $(el).attr("name"))
    .get();
}

export function parseAthleteEditForm(html: string): Parsed<AthleteEditForm> | null {
  const formHtml = extractFormHtml(html);
  if (!formHtml) return null;

  const $ = cheerio.load(formHtml);
  const entries = collectEntries($);

  return {
    id: extractId(formHtml),
    nomeCompleto: extractNomeCompleto($),
    dados: collectDados($, entries),
    cidadeId: getEntryValue(entries, "cidade") || null,
    obrigatorios: collectObrigatorios($),
    entries,
    _parsedAt: new Date().toISOString(),
  };
}
