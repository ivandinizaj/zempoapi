/** Helpers puros de normalização para os formatos que o ZEMPO grava. */

export const onlyDigits = (s: string): string => s.replace(/\D/g, "");

export function isValidCpf(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/** "52998224725" → "529.982.247-25" */
export function formatCpf(raw: string): string {
  return onlyDigits(raw).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/** "50720123" → "50720-123" */
export function formatCep(raw: string): string {
  return onlyDigits(raw).replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/** "81999990000" → "(81)99999-0000"; "8133334444" → "(81)3333-4444" (formato do ZEMPO) */
export function formatTelefone(raw: string): string {
  return onlyDigits(raw).replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1)$2-$3");
}

/** Aceita "dd/mm/aaaa" ou "aaaa-mm-dd"; retorna "dd/mm/aaaa" ou null se a data não existir. */
export function toDataBr(raw: string): string | null {
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const [d, m, y] = br ? [br[1], br[2], br[3]] : iso ? [iso[3], iso[2], iso[1]] : [];
  if (!d || !m || !y) return null;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (date.getUTCDate() !== Number(d) || date.getUTCMonth() !== Number(m) - 1) return null;
  return `${d}/${m}/${y}`;
}

/** "73,5" | 73.5 → "73.5" */
export function normalizeNumero(raw: string): string | null {
  const s = raw.replace(",", ".");
  return /^\d+(\.\d+)?$/.test(s) ? String(Number(s)) : null;
}

/**
 * O ZEMPO guarda logradouro e número no mesmo campo ("Rua X, 45").
 * Separa pelo último ", " quando o trecho final parece um número (45, 45A, S/N).
 */
export function splitEndereco(full: string | null): {
  endereco: string | null;
  numero: string | null;
} {
  if (!full) return { endereco: null, numero: null };
  const m = full.match(/^(.*\S)\s*,\s*(\d+[\w-]*|s\/?n)\s*$/i);
  return m ? { endereco: m[1], numero: m[2] } : { endereco: full, numero: null };
}

export function joinEndereco(endereco: string | null, numero: string | null): string {
  return [endereco, numero].filter((p) => p && p.trim()).join(", ");
}

/** Compara nomes ignorando acentos, caixa e espaços extras ("Sao  paulo" = "São Paulo"). */
export function normalizeNome(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
