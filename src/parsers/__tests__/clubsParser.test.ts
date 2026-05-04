import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { parseClubesData } from "../clubsParser";

const EXAMPLES_DIR = path.join(__dirname, "../../../example");

function decodeViewSource(viewSourceHtml: string): string {
  const $ = cheerio.load(viewSourceHtml);
  const lines: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $(".line-content").each((_: number, el: any) => { lines.push($(el).text()); });
  return lines.join("\n");
}

function loadHtml(filename: string): string {
  const raw = fs.readFileSync(path.join(EXAMPLES_DIR, filename), "utf8");
  return decodeViewSource(raw);
}

describe("parseClubesData - filtro PE (JU079588)", () => {
  let result: ReturnType<typeof parseClubesData>;

  beforeAll(() => {
    result = parseClubesData(loadHtml("zempo-clubes-filtro-pe.html"));
  });

  test("retorna 50 clubes na página 1", () => {
    expect(result.clubes).toHaveLength(50);
  });

  test("total geral é 124", () => {
    expect(result.total).toBe(124);
  });

  test("primeiro clube tem todos os campos esperados", () => {
    const clube = result.clubes[0];
    expect(clube.codigo).toMatch(/^CL\d+$/);
    expect(clube.nome).toBeTruthy();
    expect(clube.federacao).toBeTruthy();
    expect(clube.estado).toBeTruthy();
  });

  test("extrai o primeiro clube corretamente (Academia de Judô Gaijin)", () => {
    const clube = result.clubes[0];
    expect(clube.codigo).toBe("CL000958");
    expect(clube.nome).toContain("Gaijin");
    expect(clube.telefone).toContain("3854-1502");
    expect(clube.email).toBe("clemlautenbacher@gmail.com");
    expect(clube.federacao).toBe("FPJU");
    expect(clube.estado).toBe("Pernambuco");
  });

  test("foto do primeiro clube é URL absoluta", () => {
    const foto = result.clubes[0].foto;
    expect(foto).toMatch(/^https:\/\/zempo\.com\.br\//);
    expect(foto).toContain("arquivos/clubes/");
  });

  test("clube sem foto retorna foto null", () => {
    const semFoto = result.clubes.find((c) => c.foto === null);
    expect(semFoto).toBeDefined();
  });

  test("todos os clubes têm codigo, nome e estado", () => {
    result.clubes.forEach((clube) => {
      expect(clube.codigo).toMatch(/^CL\d+$/);
      expect(clube.nome).toBeTruthy();
      expect(clube.estado).toBeTruthy();
    });
  });
});

describe("parseClubesData - ordem DESC (todos os estados)", () => {
  let result: ReturnType<typeof parseClubesData>;

  beforeAll(() => {
    result = parseClubesData(loadHtml("zempo-clubes-ordem-desc.html"));
  });

  test("retorna 50 clubes na página 1", () => {
    expect(result.clubes).toHaveLength(50);
  });

  test("total geral é 2706", () => {
    expect(result.total).toBe(2706);
  });

  test("primeiro clube começa com letra final do alfabeto (ordem DESC por nome)", () => {
    const primeiroNome = result.clubes[0].nome!.toUpperCase();
    const ultimoNome = result.clubes[result.clubes.length - 1].nome!.toUpperCase();
    expect(primeiroNome >= ultimoNome).toBe(true);
  });
});

describe("parseClubesData - sem resultados (empty)", () => {
  let result: ReturnType<typeof parseClubesData>;

  beforeAll(() => {
    result = parseClubesData(loadHtml("zempo-clubes-emty.html"));
  });

  test("retorna array vazio de clubes", () => {
    expect(result.clubes).toEqual([]);
  });

  test("total é 0", () => {
    expect(result.total).toBe(0);
  });
});
