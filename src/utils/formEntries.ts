import type { EditFormEntry } from "../types";

/** Valor do primeiro campo com esse `name`, como `$("[name=x]").val()` no navegador. */
export function getEntryValue(entries: EditFormEntry[], name: string): string {
  return entries.find((e) => e.name === name)?.value ?? "";
}
