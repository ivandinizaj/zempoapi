import {
  validateAthleteId,
  validateAtletaCodigo,
  validateClubId,
  validateFiltroEstado,
  validateOrdem,
  validatePagina,
} from "..";

// Cada validator retorna null para entrada válida e uma mensagem em pt-BR caso contrário.
describe.each([
  {
    nome: "validateAthleteId",
    fn: validateAthleteId,
    validos: ["79588", "079588", "1"],
    invalidos: ["", "JU079588", "79588a", "-1", "1.5", " 1"],
  },
  {
    nome: "validateAtletaCodigo",
    fn: validateAtletaCodigo,
    validos: ["JU079588", "ju079588", "JU1"],
    invalidos: ["", "JU", "079588", "CL002294", "JU07958x", "XJU079588"],
  },
  {
    nome: "validateClubId",
    fn: validateClubId,
    validos: ["2294", "CL002294", "cl2294"],
    invalidos: ["", "CL", "JU002294", "22a94", "CL-2294"],
  },
  {
    nome: "validateOrdem",
    fn: validateOrdem,
    validos: ["", "ASC", "DESC"],
    invalidos: ["desc", "nome", "DESC "],
  },
  {
    nome: "validateFiltroEstado",
    fn: validateFiltroEstado,
    validos: ["PE", "sp", "Df"],
    invalidos: ["XX", "BR", "17", "PER"],
  },
])("$nome", ({ fn, validos, invalidos }) => {
  test.each(validos)("aceita %p", (input) => {
    expect(fn(input)).toBeNull();
  });

  test.each(invalidos)("rejeita %p com mensagem", (input) => {
    expect(fn(input)).toEqual(expect.any(String));
  });
});

describe("validatePagina", () => {
  test.each([1, 2, 100])("aceita %p", (p) => expect(validatePagina(p)).toBeNull());
  test.each([0, -1, NaN])("rejeita %p", (p) => expect(validatePagina(p)).not.toBeNull());
});

test("mensagem de estado inválido lista as siglas aceitas", () => {
  expect(validateFiltroEstado("XX")).toMatch(/AC, AL, .*TO/);
});
