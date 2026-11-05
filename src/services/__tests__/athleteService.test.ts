import { getAthleteById, getAthleteByCode } from "../athleteService";
import atletasCache from "../../cache/atletasCache";
import { fetchPage } from "../../http/zempoClient";
import { parseUserData } from "../../parsers/athleteParser";
import type { Athlete, Parsed } from "../../types";

jest.mock("../../http/zempoClient", () => ({
  BASE_URL: "https://zempo.test",
  fetchPage: jest.fn(),
}));
jest.mock("../../parsers/athleteParser", () => ({ parseUserData: jest.fn() }));

const fetchPageMock = fetchPage as jest.MockedFunction<typeof fetchPage>;
const parseMock = parseUserData as jest.MockedFunction<typeof parseUserData>;

function athlete(overrides: Partial<Parsed<Athlete>> = {}): Parsed<Athlete> {
  return {
    id: "079588",
    codigo: "JU079588",
    nomeCompleto: "Ivan Diniz",
    _parsedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Parsed<Athlete>;
}

beforeEach(() => {
  jest.resetAllMocks();
  atletasCache.flush();
  fetchPageMock.mockResolvedValue("<html></html>");
  parseMock.mockReturnValue(athlete());
});

describe("getAthleteById", () => {
  test("busca a página de detalhes do atleta e separa _parsedAt de data", async () => {
    const result = await getAthleteById("79588");

    expect(fetchPageMock).toHaveBeenCalledWith(
      "https://zempo.test/index.php?secao=pessoas_editar&id=79588&detalhes=1",
    );
    expect(parseMock).toHaveBeenCalledWith("<html></html>", "https://zempo.test");
    expect(result.cached).toBe(false);
    expect(result._parsedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result.data).not.toHaveProperty("_parsedAt");
    expect(result.data.nomeCompleto).toBe("Ivan Diniz");
  });

  test("segunda chamada vem do cache sem consultar o ZEMPO", async () => {
    await getAthleteById("79588");
    const second = await getAthleteById("79588");

    expect(second.cached).toBe(true);
    expect(second._parsedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(fetchPageMock).toHaveBeenCalledTimes(1);
  });

  test("forceRefresh ignora o cache e o atualiza", async () => {
    await getAthleteById("79588");
    parseMock.mockReturnValue(athlete({ nomeCompleto: "Nome Atualizado" }));

    const refreshed = await getAthleteById("79588", true);
    const afterwards = await getAthleteById("79588");

    expect(refreshed).toMatchObject({ cached: false, data: { nomeCompleto: "Nome Atualizado" } });
    expect(afterwards).toMatchObject({ cached: true, data: { nomeCompleto: "Nome Atualizado" } });
    expect(fetchPageMock).toHaveBeenCalledTimes(2);
  });

  test("não guarda no cache uma página sem dados (atleta inexistente)", async () => {
    parseMock.mockReturnValue(athlete({ id: null, codigo: null, nomeCompleto: null }));

    await getAthleteById("1");
    await getAthleteById("1");

    expect(fetchPageMock).toHaveBeenCalledTimes(2);
  });

  test("requisições simultâneas para o mesmo atleta compartilham um único fetch", async () => {
    let release!: (html: string) => void;
    fetchPageMock.mockReturnValueOnce(new Promise((r) => (release = r)));

    const calls = Promise.all([getAthleteById("79588"), getAthleteById("79588")]);
    release("<html></html>");
    const [a, b] = await calls;

    expect(fetchPageMock).toHaveBeenCalledTimes(1);
    expect(a.data).toEqual(b.data);
  });

  test("erro do ZEMPO é propagado e não fica preso como requisição em andamento", async () => {
    fetchPageMock.mockRejectedValueOnce(new Error("ZEMPO fora"));

    await expect(getAthleteById("79588")).rejects.toThrow("ZEMPO fora");
    await expect(getAthleteById("79588")).resolves.toMatchObject({ cached: false });
    expect(fetchPageMock).toHaveBeenCalledTimes(2);
  });
});

describe("getAthleteByCode", () => {
  test("converte o código JU no ID numérico e compartilha o cache com getAthleteById", async () => {
    await getAthleteByCode("JU079588");
    const byId = await getAthleteById("079588");

    expect(fetchPageMock).toHaveBeenCalledWith(expect.stringContaining("&id=079588&"));
    expect(byId.cached).toBe(true);
  });

  test("rejeita código sem o padrão JU", async () => {
    await expect(getAthleteByCode("CL002294")).rejects.toThrow("Código inválido");
    expect(fetchPageMock).not.toHaveBeenCalled();
  });
});
