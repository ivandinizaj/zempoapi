import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { parseClubDetails } from "../clubDetailsParser";

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

describe("parseClubDetails - CL002294 (4º Bravo Lutas)", () => {
  let result: ReturnType<typeof parseClubDetails>;

  beforeAll(() => {
    result = parseClubDetails(loadHtml("zempo-clubes-details.html"));
  });

  test("extrai o codigo corretamente", () => {
    expect(result.codigo).toBe("CL002294");
  });

  test("extrai o nome contendo 'Bravo Lutas'", () => {
    expect(result.nome).toContain("Bravo Lutas");
  });

  test("extrai a sigla como abreviação pura (sem hint do ZEMPO)", () => {
    expect(result.sigla).toBe("4BL");
  });

  test("extrai a federação", () => {
    expect(result.federacao).toBe("FMTJ - MT");
  });

  test("cnpj vazio retorna null", () => {
    expect(result.cnpj).toBeNull();
  });

  test("extrai o email", () => {
    expect(result.email).toBe("4bpm@pm.mt.gov.br");
  });

  test("extrai o telefone", () => {
    expect(result.telefone).toContain("99903-0499");
  });

  test("website vazio retorna null", () => {
    expect(result.website).toBeNull();
  });

  test("extrai o status como Ativo", () => {
    expect(result.status).toBe("Ativo");
  });

  test("extrai federado como true (sim)", () => {
    expect(result.federado).toBe(true);
  });

  test("extrai o CEP", () => {
    expect(result.cep).toBe("78110-302");
  });

  test("extrai o endereço contendo o logradouro", () => {
    expect(result.endereco).toContain("Filinto Muller");
  });

  test("extrai o estado", () => {
    expect(result.estado).toBe("Mato Grosso");
  });

  test("extrai a cidade contendo o nome", () => {
    expect(result.cidade).toContain("rzea Grande");
  });

  test("extrai o bairro", () => {
    expect(result.bairro).toBe("Centro");
  });

  test("extrai o complemento", () => {
    expect(result.complemento).toBe("bairro centro");
  });

  test("facebook vazio retorna null", () => {
    expect(result.facebook).toBeNull();
  });

  test("extrai o instagram", () => {
    expect(result.instagram).toBe("4bravopmmt");
  });

  test("whatsapp vazio retorna null", () => {
    expect(result.whatsapp).toBeNull();
  });

  test("twitter vazio retorna null", () => {
    expect(result.twitter).toBeNull();
  });

  test("youtube vazio retorna null", () => {
    expect(result.youtube).toBeNull();
  });

  test("inclui _parsedAt no formato ISO", () => {
    expect(result._parsedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
