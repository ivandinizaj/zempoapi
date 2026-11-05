import { parseClubId, parseCodigo } from "../coding";
import { resolveAbsoluteUrl } from "../url";
import { normalizeText } from "../text";
import { isSessionExpiredHtml } from "../session";

describe("parseCodigo", () => {
  test("extrai id e código normalizado em maiúsculas", () => {
    expect(parseCodigo("ju079588")).toEqual({ id: "079588", codigo: "JU079588" });
  });

  test("encontra o código dentro de um texto maior", () => {
    expect(parseCodigo("#JU079588 - Ivan")).toEqual({ id: "079588", codigo: "JU079588" });
  });

  test("retorna null sem código JU", () => {
    expect(parseCodigo("CL002294")).toBeNull();
  });
});

describe("parseClubId", () => {
  test.each([
    ["2294", "2294"],
    ["CL002294", "2294"],
    ["cl2294", "2294"],
    ["CL000000", "0"],
  ])("%s → %s", (input, expected) => {
    expect(parseClubId(input)).toBe(expected);
  });

  test.each(["", "CL", "JU002294", "CL22a"])("rejeita %p", (input) => {
    expect(parseClubId(input)).toBeNull();
  });
});

describe("resolveAbsoluteUrl", () => {
  const base = "https://zempo.com.br";

  test("mantém URL absoluta", () => {
    expect(resolveAbsoluteUrl("https://cdn.x/foto.jpg", base)).toBe("https://cdn.x/foto.jpg");
  });

  test.each(["arquivos/foto.jpg", "/arquivos/foto.jpg"])("resolve caminho relativo %p", (src) => {
    expect(resolveAbsoluteUrl(src, base)).toBe("https://zempo.com.br/arquivos/foto.jpg");
  });

  test.each([undefined, ""])("retorna null para %p", (src) => {
    expect(resolveAbsoluteUrl(src, base)).toBeNull();
  });
});

test("normalizeText colapsa espaços, tabs e quebras de linha", () => {
  expect(normalizeText("  Ivan \n\t Diniz  ")).toBe("Ivan Diniz");
});

describe("isSessionExpiredHtml", () => {
  test("detecta o redirect do ZEMPO para /portal", () => {
    expect(isSessionExpiredHtml('<script>window.top.location.href = "/portal"</script>')).toBe(true);
  });

  test("não confunde página normal que só menciona /portal", () => {
    expect(isSessionExpiredHtml('<a href="/portal">Portal</a>')).toBe(false);
  });
});
