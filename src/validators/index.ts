import { getValidSiglas, isValidEstadoSigla } from "../utils/estadoMapper";

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
