import clubesCache from "../cache/clubesCache";
import { fetchPage, BASE_URL } from "../http/zempoClient";
import { parseClubesData } from "../parsers/clubsParser";
import type { ClubsPage, GetClubesOptions, ServiceResult } from "../types";

export async function getClubes({
  filtro,
  ordem,
  pagina = 1,
  forceRefresh = false,
}: GetClubesOptions = {}): Promise<ServiceResult<ClubsPage>> {
  const ordemNorm = ordem === "DESC" ? "DESC" : "";
  const cacheKey = `filtro:${filtro ?? "todos"}:ordem:${ordemNorm}:pagina:${pagina}`;

  if (!forceRefresh) {
    const cached = clubesCache.get(cacheKey);
    if (cached) return { data: cached, cached: true };
  }

  const params = new URLSearchParams({
    secao: "clubes",
    criterio: "nome",
    ordem: ordemNorm,
  });
  if (filtro) params.set("filtro", String(filtro));
  if (pagina > 1) params.set("paginax", String(pagina));

  const html = await fetchPage(`${BASE_URL}/?${params}`);
  const parsed = parseClubesData(html, BASE_URL);
  const result: ClubsPage = { ...parsed, pagina: Number(pagina) };

  clubesCache.set(cacheKey, result);
  return { data: result, cached: false };
}
