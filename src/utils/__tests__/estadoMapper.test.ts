import {
  isValidEstadoSigla,
  siglaToFiltro,
  getValidSiglas,
} from "../estadoMapper";

describe("isValidEstadoSigla", () => {
  test.each([
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ])("aceita sigla válida %s", (sigla: string) => {
    expect(isValidEstadoSigla(sigla)).toBe(true);
  });

  test.each(["XX", "BR", "ZZ", "", "123", "ABC"])(
    "rejeita sigla inválida '%s'",
    (sigla) => {
      expect(isValidEstadoSigla(sigla)).toBe(false);
    },
  );

  test("é case-insensitive", () => {
    expect(isValidEstadoSigla("pe")).toBe(true);
    expect(isValidEstadoSigla("Ac")).toBe(true);
    expect(isValidEstadoSigla("SP")).toBe(true);
  });
});

describe("siglaToFiltro", () => {
  test("AC retorna 1 (primeiro estado em ordem alfabética)", () => {
    expect(siglaToFiltro("AC")).toBe(1);
  });

  test("PE retorna 17", () => {
    expect(siglaToFiltro("PE")).toBe(17);
  });

  test("TO retorna 27 (último estado)", () => {
    expect(siglaToFiltro("TO")).toBe(27);
  });

  test("é case-insensitive", () => {
    expect(siglaToFiltro("pe")).toBe(17);
    expect(siglaToFiltro("Ac")).toBe(1);
    expect(siglaToFiltro("to")).toBe(27);
  });

  test("retorna null para sigla inválida", () => {
    expect(siglaToFiltro("XX")).toBeNull();
    expect(siglaToFiltro("")).toBeNull();
    expect(siglaToFiltro("123")).toBeNull();
  });

  test.each([
    ["AL", 2],
    ["AP", 3],
    ["AM", 4],
    ["BA", 5],
    ["CE", 6],
    ["DF", 7],
    ["ES", 8],
    ["GO", 9],
    ["MA", 10],
    ["MT", 11],
    ["MS", 12],
    ["MG", 13],
    ["PA", 14],
    ["PB", 15],
    ["PR", 16],
    ["PI", 18],
    ["RJ", 19],
    ["RN", 20],
    ["RS", 21],
    ["RO", 22],
    ["RR", 23],
    ["SC", 24],
    ["SP", 25],
    ["SE", 26],
  ] as [string, number][])(
    "%s → %i (mapeamento completo)",
    (sigla, expected) => {
      expect(siglaToFiltro(sigla)).toBe(expected);
    },
  );
});

describe("getValidSiglas", () => {
  test("retorna exatamente 27 estados", () => {
    expect(getValidSiglas()).toHaveLength(27);
  });

  test("inclui todas as siglas conhecidas", () => {
    const siglas = getValidSiglas();
    expect(siglas).toContain("AC");
    expect(siglas).toContain("PE");
    expect(siglas).toContain("TO");
    expect(siglas).toContain("SP");
  });

  test("não inclui siglas inválidas", () => {
    const siglas = getValidSiglas();
    expect(siglas).not.toContain("BR");
    expect(siglas).not.toContain("XX");
  });
});
