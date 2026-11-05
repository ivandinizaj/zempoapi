import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import apiRoutes from "..";
import { errorHandler } from "../../middleware/errorHandler";
import { getKeyStats } from "../../middleware/keyMetrics";
import { getAthleteById, getAthleteByCode } from "../../services/athleteService";
import { getClubes } from "../../services/clubsService";
import { getClubDetails } from "../../services/clubDetailsService";
import { GatewayError, ValidationError } from "../../errors/AppError";

jest.mock("../../services/athleteService");
jest.mock("../../services/clubsService");
jest.mock("../../services/clubDetailsService");
jest.mock("../../utils/logger", () => ({ __esModule: true, default: { error: jest.fn() } }));

const PARSED_AT = "2026-01-01T00:00:00.000Z";
const athleteMock = getAthleteById as jest.Mock;
const athleteByCodeMock = getAthleteByCode as jest.Mock;
const clubesMock = getClubes as jest.Mock;
const clubDetailsMock = getClubDetails as jest.Mock;

let server: Server;
let baseUrl: string;

beforeAll((done) => {
  const app = express();
  app.use("/api/v1", apiRoutes);
  app.use(errorHandler);
  server = app.listen(0, () => {
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.API_KEY;
  delete process.env.API_KEYS;
});

async function get(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}${path}`, { headers });
  return { status: res.status, body: (await res.json()) as any };
}

describe("GET /atleta/:id", () => {
  test("200 com o envelope padrão da API", async () => {
    athleteMock.mockResolvedValue({ data: { nomeCompleto: "Ivan" }, cached: true, _parsedAt: PARSED_AT });

    const { status, body } = await get("/atleta/79588");

    expect(status).toBe(200);
    expect(body).toEqual({
      success: true,
      _cached: true,
      _parsedAt: PARSED_AT,
      data: { nomeCompleto: "Ivan" },
    });
    expect(athleteMock).toHaveBeenCalledWith("79588", false);
  });

  test("?refresh=true força atualização", async () => {
    athleteMock.mockResolvedValue({ data: {}, cached: false, _parsedAt: PARSED_AT });

    await get("/atleta/79588?refresh=true");

    expect(athleteMock).toHaveBeenCalledWith("79588", true);
  });

  test("400 para ID não numérico, sem chamar o service", async () => {
    const { status, body } = await get("/atleta/JU079588");

    expect(status).toBe(400);
    expect(body).toEqual({ error: "Bad Request", message: expect.stringContaining("numérico") });
    expect(athleteMock).not.toHaveBeenCalled();
  });

  test("502 quando a comunicação com o ZEMPO falha", async () => {
    athleteMock.mockRejectedValue(new GatewayError(new Error("ECONNRESET")));

    const { status, body } = await get("/atleta/79588");

    expect(status).toBe(502);
    expect(body).toEqual({
      error: "Bad Gateway",
      message: "Erro ao comunicar com o ZEMPO: ECONNRESET",
    });
  });

  test("500 para erro não tipado (bug)", async () => {
    athleteMock.mockRejectedValue(new Error("boom"));

    const { status, body } = await get("/atleta/79588");

    expect(status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
  });

  test("AppError lançado pelo service mantém o status original", async () => {
    athleteMock.mockRejectedValue(new ValidationError("algo específico"));

    const { status, body } = await get("/atleta/79588");

    expect(status).toBe(400);
    expect(body.message).toBe("algo específico");
  });
});

describe("GET /atleta/codigo/:codigo", () => {
  test("aceita código em minúsculas", async () => {
    athleteByCodeMock.mockResolvedValue({ data: {}, cached: false, _parsedAt: PARSED_AT });

    const { status } = await get("/atleta/codigo/ju079588");

    expect(status).toBe(200);
    expect(athleteByCodeMock).toHaveBeenCalledWith("ju079588", false);
  });

  test("400 para código fora do padrão JU", async () => {
    const { status } = await get("/atleta/codigo/079588");

    expect(status).toBe(400);
    expect(athleteByCodeMock).not.toHaveBeenCalled();
  });
});

describe("GET /clubes", () => {
  beforeEach(() => {
    clubesMock.mockResolvedValue({
      data: { clubes: [{ codigo: "CL1" }], total: 124, pagina: 2 },
      cached: false,
      _parsedAt: PARSED_AT,
    });
  });

  test("achata a página de clubes no envelope (pagina, total, data)", async () => {
    const { status, body } = await get("/clubes?pagina=2");

    expect(status).toBe(200);
    expect(body).toEqual({
      success: true,
      _cached: false,
      _parsedAt: PARSED_AT,
      pagina: 2,
      total: 124,
      data: [{ codigo: "CL1" }],
    });
  });

  test("converte a sigla do estado no filtro numérico do ZEMPO", async () => {
    await get("/clubes?filtro=pe&ordem=DESC&refresh=true");

    expect(clubesMock).toHaveBeenCalledWith({
      filtro: 17,
      ordem: "DESC",
      pagina: 1,
      forceRefresh: true,
    });
  });

  test("sem parâmetros usa página 1, sem filtro e ordem padrão", async () => {
    await get("/clubes");

    expect(clubesMock).toHaveBeenCalledWith({
      filtro: undefined,
      ordem: "",
      pagina: 1,
      forceRefresh: false,
    });
  });

  test.each([
    ["sigla inexistente", "/clubes?filtro=XX", "Sigla de estado inválida"],
    ["ordem desconhecida", "/clubes?ordem=nome", "ordem"],
    ["página negativa", "/clubes?pagina=-1", "pagina"],
  ])("400 para %s", async (_caso, path, trecho) => {
    const { status, body } = await get(path);

    expect(status).toBe(400);
    expect(body.message).toContain(trecho);
    expect(clubesMock).not.toHaveBeenCalled();
  });
});

describe("GET /clubes/:id", () => {
  test.each(["2294", "CL002294"])("aceita %s", async (id) => {
    clubDetailsMock.mockResolvedValue({ data: { nome: "X" }, cached: false, _parsedAt: PARSED_AT });

    const { status, body } = await get(`/clubes/${id}`);

    expect(status).toBe(200);
    expect(body.data).toEqual({ nome: "X" });
    expect(clubDetailsMock).toHaveBeenCalledWith(id, { forceRefresh: false });
  });

  test("400 para ID inválido", async () => {
    const { status } = await get("/clubes/abc");

    expect(status).toBe(400);
    expect(clubDetailsMock).not.toHaveBeenCalled();
  });
});

describe("autenticação", () => {
  beforeEach(() => {
    process.env.API_KEYS = JSON.stringify({ "chave-app": "app-mobile" });
    athleteMock.mockResolvedValue({ data: {}, cached: false, _parsedAt: PARSED_AT });
  });

  test("401 sem o header X-API-Key", async () => {
    const { status, body } = await get("/atleta/1");

    expect(status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(athleteMock).not.toHaveBeenCalled();
  });

  test("403 com key desconhecida", async () => {
    const { status } = await get("/atleta/1", { "X-API-Key": "errada" });

    expect(status).toBe(403);
    expect(athleteMock).not.toHaveBeenCalled();
  });

  test("200 com key válida e a requisição é contabilizada para o label da key", async () => {
    const before = getKeyStats()["app-mobile"]?.requests ?? 0;

    const { status } = await get("/atleta/1", { "X-API-Key": "chave-app" });

    expect(status).toBe(200);
    expect(getKeyStats()["app-mobile"].requests).toBe(before + 1);
  });

  test("API_KEY simples continua aceita (retrocompatibilidade)", async () => {
    delete process.env.API_KEYS;
    process.env.API_KEY = "legada";

    expect((await get("/atleta/1", { "X-API-Key": "legada" })).status).toBe(200);
    expect((await get("/atleta/1")).status).toBe(401);
  });

  test("API_KEYS malformado é ignorado sem derrubar a API", async () => {
    process.env.API_KEYS = "{nao-e-json";

    expect((await get("/atleta/1")).status).toBe(200);
  });

});

describe("admin", () => {
  test("GET /status expõe sessão, caches e config", async () => {
    const { status, body } = await get("/status");

    expect(status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      session: { active: false },
      caches: {
        atletas: { name: "AtletasCache" },
        clubes: expect.any(Object),
        clubesDetalhes: expect.any(Object),
      },
    });
  });
});
