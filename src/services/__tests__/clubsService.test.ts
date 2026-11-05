import { getClubes } from "../clubsService";
import { getClubDetails } from "../clubDetailsService";
import clubesCache from "../../cache/clubesCache";
import clubDetailsCache from "../../cache/clubDetailsCache";
import { fetchPage } from "../../http/zempoClient";
import { parseClubesData } from "../../parsers/clubsParser";
import { parseClubDetails } from "../../parsers/clubDetailsParser";

jest.mock("../../http/zempoClient", () => ({
  BASE_URL: "https://zempo.test",
  fetchPage: jest.fn(),
}));
jest.mock("../../parsers/clubsParser", () => ({ parseClubesData: jest.fn() }));
jest.mock("../../parsers/clubDetailsParser", () => ({ parseClubDetails: jest.fn() }));

const fetchPageMock = fetchPage as jest.MockedFunction<typeof fetchPage>;
const PARSED_AT = "2026-01-01T00:00:00.000Z";

function requestedParams(call = 0): URLSearchParams {
  return new URL(fetchPageMock.mock.calls[call][0]).searchParams;
}

beforeEach(() => {
  jest.resetAllMocks();
  clubesCache.flush();
  clubDetailsCache.flush();
  fetchPageMock.mockResolvedValue("<html></html>");
  (parseClubesData as jest.Mock).mockReturnValue({
    clubes: [{ codigo: "CL000958" }],
    total: 124,
    pagina: 1,
    _parsedAt: PARSED_AT,
  });
  (parseClubDetails as jest.Mock).mockReturnValue({
    codigo: "CL002294",
    nome: "4º Bravo Lutas",
    _parsedAt: PARSED_AT,
  });
});

describe("getClubes", () => {
  test("sem opções: busca a página 1 de todos os estados em ordem crescente", async () => {
    const result = await getClubes();

    const params = requestedParams();
    expect(params.get("secao")).toBe("clubes");
    expect(params.get("ordem")).toBe("");
    expect(params.has("filtro")).toBe(false);
    expect(params.has("paginax")).toBe(false);
    expect(result).toEqual({
      data: { clubes: [{ codigo: "CL000958" }], total: 124, pagina: 1 },
      cached: false,
      _parsedAt: PARSED_AT,
    });
  });

  test("repassa filtro, ordem DESC e página ao ZEMPO e devolve o número da página", async () => {
    const result = await getClubes({ filtro: 17, ordem: "DESC", pagina: 3 });

    const params = requestedParams();
    expect(params.get("filtro")).toBe("17");
    expect(params.get("ordem")).toBe("DESC");
    expect(params.get("paginax")).toBe("3");
    expect(result.data.pagina).toBe(3);
  });

  test("ASC e ordem vazia são a mesma consulta (mesma entrada de cache)", async () => {
    await getClubes({ ordem: "ASC" });
    const second = await getClubes({ ordem: "" });

    expect(requestedParams().get("ordem")).toBe("");
    expect(second.cached).toBe(true);
    expect(fetchPageMock).toHaveBeenCalledTimes(1);
  });

  test("filtros e páginas diferentes não compartilham cache", async () => {
    await getClubes({ filtro: 17 });
    await getClubes({ filtro: 25 });
    await getClubes({ filtro: 17, pagina: 2 });

    expect(fetchPageMock).toHaveBeenCalledTimes(3);
  });

  test("forceRefresh consulta o ZEMPO mesmo com cache válido", async () => {
    await getClubes();
    const refreshed = await getClubes({ forceRefresh: true });

    expect(refreshed.cached).toBe(false);
    expect(fetchPageMock).toHaveBeenCalledTimes(2);
  });
});

describe("getClubDetails", () => {
  test("aceita o código CL e consulta o ZEMPO com o ID numérico sem zeros", async () => {
    const result = await getClubDetails("CL002294");

    const params = requestedParams();
    expect(params.get("secao")).toBe("clubes_editar");
    expect(params.get("id")).toBe("2294");
    expect(result).toMatchObject({ cached: false, _parsedAt: PARSED_AT });
    expect(result.data).not.toHaveProperty("_parsedAt");
  });

  test("ID numérico e código CL do mesmo clube compartilham o cache", async () => {
    await getClubDetails("2294");
    const second = await getClubDetails("cl002294");

    expect(second.cached).toBe(true);
    expect(fetchPageMock).toHaveBeenCalledTimes(1);
  });

  test("forceRefresh ignora o cache", async () => {
    await getClubDetails("2294");
    await getClubDetails("2294", { forceRefresh: true });

    expect(fetchPageMock).toHaveBeenCalledTimes(2);
  });

  test("rejeita ID inválido sem consultar o ZEMPO", async () => {
    await expect(getClubDetails("JU079588")).rejects.toThrow("ID de clube inválido");
    expect(fetchPageMock).not.toHaveBeenCalled();
  });
});
