import localidadesCache from "../cache/localidadesCache";
import { postForm, BASE_URL } from "../http/zempoClient";
import { parseLocalidades } from "../parsers/localidadesParser";
import type { Localidade, ServiceResult } from "../types";

async function getLocalidades(
  cacheKey: string,
  path: string,
  params: Record<string, string>,
  forceRefresh: boolean,
): Promise<ServiceResult<Localidade[]>> {
  if (!forceRefresh) {
    const cached = localidadesCache.get(cacheKey);
    if (cached) return { data: cached.itens, cached: true, _parsedAt: cached._parsedAt };
  }

  const html = await postForm(`${BASE_URL}/${path}`, params);
  const parsed = parseLocalidades(html);
  if (parsed.itens.length) localidadesCache.set(cacheKey, parsed);
  return { data: parsed.itens, cached: false, _parsedAt: parsed._parsedAt };
}

/** Cidades de um estado (mesma lista do select "Cidade" do ZEMPO). */
export function getCidades(uf: string, forceRefresh = false): Promise<ServiceResult<Localidade[]>> {
  const sigla = uf.toUpperCase();
  return getLocalidades(`cidades:${sigla}`, "retorno_cidades.php", { estado: sigla }, forceRefresh);
}

/** Bairros de uma cidade (ID ZEMPO da cidade). */
export function getBairros(
  cidadeId: string,
  forceRefresh = false,
): Promise<ServiceResult<Localidade[]>> {
  return getLocalidades(
    `bairros:${cidadeId}`,
    "retorno_bairros.php",
    { cidade: cidadeId },
    forceRefresh,
  );
}
