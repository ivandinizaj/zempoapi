import atletasCache from "../cache/atletasCache";
import { fetchPage, BASE_URL } from "../http/zempoClient";
import { parseUserData } from "../parsers/athleteParser";
import { parseCodigo } from "../utils/coding";
import type { Athlete, ServiceResult } from "../types";

const inFlight = new Map<string, Promise<Athlete>>();

async function fetchAndParse(id: string): Promise<Athlete> {
  const url = `${BASE_URL}/index.php?secao=pessoas_editar&id=${id}&detalhes=1`;
  const html = await fetchPage(url);
  const data = parseUserData(html, BASE_URL);
  if (data.nomeCompleto ?? data.id) atletasCache.set(id, data);
  return data;
}

export async function getAthleteById(
  userId: string,
  forceRefresh = false,
): Promise<ServiceResult<Athlete>> {
  const key = String(userId);

  if (!forceRefresh) {
    const cached = atletasCache.get(key);
    if (cached) return { data: cached, cached: true };
  }

  if (!forceRefresh && inFlight.has(key)) {
    const data = await inFlight.get(key)!;
    return { data, cached: false };
  }

  const promise = fetchAndParse(key).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  const data = await promise;
  return { data, cached: false };
}

export async function getAthleteByCode(
  codigo: string,
  forceRefresh = false,
): Promise<ServiceResult<Athlete>> {
  const parsed = parseCodigo(codigo);
  if (!parsed) throw new Error(`Código inválido: ${codigo}`);
  return getAthleteById(parsed.id, forceRefresh);
}
