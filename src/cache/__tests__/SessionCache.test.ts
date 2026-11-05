import type { Response } from "node-fetch";
import type SessionCacheInstance from "../SessionCache";

jest.mock("node-fetch", () => jest.fn());

function loginResponse(setCookie: string[]): Response {
  return { headers: { raw: () => ({ "set-cookie": setCookie }) } } as unknown as Response;
}

function loadSessionCache(env: Record<string, string | undefined> = {}) {
  Object.assign(process.env, {
    ZEMPO_CODIGO: "JU079588",
    ZEMPO_SENHA: "segredo",
    SESSION_CACHE_TTL: "60",
    ZEMPO_BASE_URL: "https://zempo.test",
    ...env,
  });
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k];

  let cache!: typeof SessionCacheInstance;
  let fetchMock!: jest.Mock;
  jest.isolateModules(() => {
    fetchMock = require("node-fetch");
    cache = require("../SessionCache").default;
  });
  return { cache, fetchMock };
}

afterEach(() => jest.useRealTimers());

describe("SessionCache.getCookie", () => {
  test("faz login via POST e monta o cookie com PHPSESSID e codigo", async () => {
    const { cache, fetchMock } = loadSessionCache();
    fetchMock.mockResolvedValueOnce(
      loginResponse(["outro=1; path=/", "PHPSESSID=s3ss10n; path=/; HttpOnly"]),
    );

    await expect(cache.getCookie()).resolves.toBe("PHPSESSID=s3ss10n; codigo=JU079588");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://zempo.test/?acao=logando");
    expect(init.method).toBe("POST");
    // redirect manual: o Set-Cookie vem no 302 e se perderia ao seguir o redirect
    expect(init.redirect).toBe("manual");
  });

  test("reutiliza a sessão enquanto ela estiver dentro do TTL", async () => {
    const { cache, fetchMock } = loadSessionCache();
    fetchMock.mockResolvedValue(loginResponse(["PHPSESSID=a"]));

    await cache.getCookie();
    await cache.getCookie();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("requisições simultâneas compartilham um único login", async () => {
    const { cache, fetchMock } = loadSessionCache();
    fetchMock.mockResolvedValue(loginResponse(["PHPSESSID=a"]));

    const cookies = await Promise.all([cache.getCookie(), cache.getCookie(), cache.getCookie()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Set(cookies).size).toBe(1);
  });

  test("refaz o login quando o TTL expira", async () => {
    jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    const { cache, fetchMock } = loadSessionCache({ SESSION_CACHE_TTL: "60" });
    fetchMock
      .mockResolvedValueOnce(loginResponse(["PHPSESSID=primeiro"]))
      .mockResolvedValueOnce(loginResponse(["PHPSESSID=segundo"]));

    await cache.getCookie();
    jest.setSystemTime(new Date("2026-01-01T00:01:01Z"));

    expect(cache.isValid()).toBe(false);
    await expect(cache.getCookie()).resolves.toContain("PHPSESSID=segundo");
  });

  test("invalidate() força novo login na próxima chamada", async () => {
    const { cache, fetchMock } = loadSessionCache();
    fetchMock.mockResolvedValue(loginResponse(["PHPSESSID=a"]));

    await cache.getCookie();
    cache.invalidate();
    await cache.getCookie();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("falha sem PHPSESSID e permite nova tentativa depois", async () => {
    const { cache, fetchMock } = loadSessionCache();
    fetchMock
      .mockResolvedValueOnce(loginResponse([]))
      .mockResolvedValueOnce(loginResponse(["PHPSESSID=ok"]));

    await expect(cache.getCookie()).rejects.toThrow(/PHPSESSID não encontrado/);
    expect(cache.isValid()).toBe(false);
    await expect(cache.getCookie()).resolves.toContain("PHPSESSID=ok");
  });

  test("falha sem credenciais e não chama o ZEMPO", async () => {
    const { cache, fetchMock } = loadSessionCache({ ZEMPO_SENHA: undefined });

    await expect(cache.getCookie()).rejects.toThrow(/ZEMPO_CODIGO e ZEMPO_SENHA/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("SessionCache.getInfo", () => {
  test("sem sessão: inativa e sem expiração", () => {
    const { cache } = loadSessionCache();
    expect(cache.getInfo()).toEqual({ active: false, expiresAt: null, expiresInSeconds: 0 });
  });

  test("com sessão: reporta expiração conforme o TTL", async () => {
    jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    const { cache, fetchMock } = loadSessionCache({ SESSION_CACHE_TTL: "60" });
    fetchMock.mockResolvedValueOnce(loginResponse(["PHPSESSID=a"]));

    await cache.getCookie();

    expect(cache.getInfo()).toEqual({
      active: true,
      expiresAt: "2026-01-01T00:01:00.000Z",
      expiresInSeconds: 60,
    });
  });
});
