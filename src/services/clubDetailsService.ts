import clubDetailsCache from "../cache/clubDetailsCache";
import { fetchPage, BASE_URL } from "../http/zempoClient";
import { parseClubDetails } from "../parsers/clubDetailsParser";
import { parseClubId } from "../utils/coding";
import type {
  ClubDetails,
  GetClubDetailsOptions,
  ServiceResult,
} from "../types";

export async function getClubDetails(
  id: string,
  { forceRefresh = false }: GetClubDetailsOptions = {},
): Promise<ServiceResult<ClubDetails>> {
  const zempoId = parseClubId(id);
  if (!zempoId) throw new Error(`ID de clube inválido: ${id}`);

  const cacheKey = `club:${zempoId}`;

  if (!forceRefresh) {
    const cached = clubDetailsCache.get(cacheKey);
    if (cached) {
      const { _parsedAt, ...data } = cached;
      return { data, cached: true, _parsedAt };
    }
  }

  const params = new URLSearchParams({
    secao: "clubes_editar",
    detalhes: "1",
    id: zempoId,
  });

  const html = await fetchPage(`${BASE_URL}/?${params}`);
  const parsed = parseClubDetails(html);
  clubDetailsCache.set(cacheKey, parsed);

  const { _parsedAt, ...data } = parsed;
  return { data, cached: false, _parsedAt };
}
