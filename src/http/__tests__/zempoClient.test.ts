import type { Response } from "node-fetch";
import type * as ZempoClient from "../zempoClient";

jest.mock("node-fetch", () => jest.fn());
jest.mock("../../cache/SessionCache", () => ({
  __esModule: true,
  default: { getCookie: jest.fn(), invalidate: jest.fn() },
}));

const SESSION_EXPIRED_HTML = '<script>window.top.location.href = "https://zempo.com.br/portal"</script>';

function htmlResponse(body: string | Buffer, status = 200): Response {
  const buffer = typeof body === "string" ? Buffer.from(body, "utf8") : body;
  return {
    status,
    headers: { get: () => null },
    buffer: () => Promise.resolve(buffer),
  } as unknown as Response;
}

function networkError(code: string): Error {
  return Object.assign(new Error(`connect ${code}`), { code });
}

// Recarrega o módulo a cada teste: pLimit, constantes de env e mocks ficam isolados.
function loadClient() {
  process.env.ZEMPO_REQUEST_DELAY_MS = "0";
  let mod!: typeof ZempoClient;
  let fetchMock!: jest.Mock;
  let session!: { getCookie: jest.Mock; invalidate: jest.Mock };
  jest.isolateModules(() => {
    fetchMock = require("node-fetch");
    session = require("../../cache/SessionCache").default;
    mod = require("../zempoClient");
  });
  session.getCookie.mockResolvedValue("PHPSESSID=abc; codigo=JU1");
  return { fetchPage: mod.fetchPage, fetchMock, session };
}

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("fetchPage", () => {
  test("envia o cookie da sessão e retorna o HTML", async () => {
    const { fetchPage, fetchMock } = loadClient();
    fetchMock.mockResolvedValueOnce(htmlResponse("<html>ok</html>"));

    await expect(fetchPage("https://zempo.test/x")).resolves.toBe("<html>ok</html>");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://zempo.test/x");
    expect(init.headers.Cookie).toBe("PHPSESSID=abc; codigo=JU1");
  });

  test("decodifica ISO-8859-1 conforme o charset declarado no HTML", async () => {
    const { fetchPage, fetchMock } = loadClient();
    const html = '<meta charset=iso-8859-1><td>Araújo Júnior — São Paulo</td>';
    fetchMock.mockResolvedValueOnce(htmlResponse(Buffer.from(html.replace("—", "-"), "latin1")));

    await expect(fetchPage("u")).resolves.toContain("Araújo Júnior - São Paulo");
  });

  test("usa UTF-8 quando o HTML não declara charset", async () => {
    const { fetchPage, fetchMock } = loadClient();
    fetchMock.mockResolvedValueOnce(htmlResponse("<td>Judô</td>"));

    await expect(fetchPage("u")).resolves.toBe("<td>Judô</td>");
  });

  describe("retry", () => {
    test("retenta em 5xx e retorna quando o ZEMPO se recupera", async () => {
      const { fetchPage, fetchMock } = loadClient();
      fetchMock
        .mockResolvedValueOnce(htmlResponse("", 503))
        .mockResolvedValueOnce(htmlResponse("<html>ok</html>"));

      await expect(fetchPage("u")).resolves.toBe("<html>ok</html>");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test("retenta em erro de rede transitório (ECONNRESET)", async () => {
      const { fetchPage, fetchMock } = loadClient();
      fetchMock
        .mockRejectedValueOnce(networkError("ECONNRESET"))
        .mockResolvedValueOnce(htmlResponse("ok"));

      await expect(fetchPage("u")).resolves.toBe("ok");
    });

    test("desiste após 3 tentativas e propaga o último erro", async () => {
      const { fetchPage, fetchMock } = loadClient();
      fetchMock.mockResolvedValue(htmlResponse("", 500));

      await expect(fetchPage("u")).rejects.toThrow("ZEMPO retornou 500");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    test("aborta a requisição após o timeout e não retenta", async () => {
      process.env.ZEMPO_REQUEST_TIMEOUT_MS = "20";
      const { fetchPage, fetchMock } = loadClient();
      delete process.env.ZEMPO_REQUEST_TIMEOUT_MS;
      // simula o node-fetch: rejeita com AbortError quando o signal é abortado
      fetchMock.mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () =>
              reject(Object.assign(new Error("The user aborted a request."), { name: "AbortError" })),
            );
          }),
      );

      await expect(fetchPage("u")).rejects.toThrow("aborted");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("não retenta erros desconhecidos", async () => {
      const { fetchPage, fetchMock } = loadClient();
      fetchMock.mockRejectedValue(new Error("boom"));

      await expect(fetchPage("u")).rejects.toThrow("boom");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("4xx não é retentado e o corpo é retornado ao chamador", async () => {
      const { fetchPage, fetchMock } = loadClient();
      fetchMock.mockResolvedValueOnce(htmlResponse("not found", 404));

      await expect(fetchPage("u")).resolves.toBe("not found");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("sessão expirada", () => {
    test("invalida a sessão, refaz o login e repete a requisição uma vez", async () => {
      const { fetchPage, fetchMock, session } = loadClient();
      session.getCookie
        .mockResolvedValueOnce("PHPSESSID=velho")
        .mockResolvedValueOnce("PHPSESSID=novo");
      fetchMock
        .mockResolvedValueOnce(htmlResponse(SESSION_EXPIRED_HTML))
        .mockResolvedValueOnce(htmlResponse("<html>dados</html>"));

      await expect(fetchPage("u")).resolves.toBe("<html>dados</html>");
      expect(session.invalidate).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[1][1].headers.Cookie).toBe("PHPSESSID=novo");
    });

    test("falha se a sessão continuar expirada após renovar", async () => {
      const { fetchPage, fetchMock } = loadClient();
      fetchMock.mockResolvedValue(htmlResponse(SESSION_EXPIRED_HTML));

      await expect(fetchPage("u")).rejects.toThrow(/autenticar no ZEMPO/);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  test("propaga falha de login sem chamar o ZEMPO", async () => {
    const { fetchPage, fetchMock, session } = loadClient();
    session.getCookie.mockRejectedValueOnce(new Error("Login falhou"));

    await expect(fetchPage("u")).rejects.toThrow("Login falhou");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
