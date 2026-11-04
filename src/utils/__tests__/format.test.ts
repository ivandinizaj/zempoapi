import {
  formatCep,
  formatCpf,
  formatTelefone,
  isValidCpf,
  joinEndereco,
  normalizeNome,
  normalizeNumero,
  splitEndereco,
  toDataBr,
} from "../format";

describe("format", () => {
  it("valida e formata CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("formata CEP e telefone", () => {
    expect(formatCep("50720123")).toBe("50720-123");
    expect(formatTelefone("81999990000")).toBe("(81)99999-0000");
    expect(formatTelefone("(81) 3333-4444")).toBe("(81)3333-4444");
  });

  it("converte datas", () => {
    expect(toDataBr("2009-06-18")).toBe("18/06/2009");
    expect(toDataBr("18/06/2009")).toBe("18/06/2009");
    expect(toDataBr("29/02/2023")).toBeNull();
    expect(toDataBr("18-06-2009")).toBeNull();
  });

  it("normaliza números", () => {
    expect(normalizeNumero("96.00")).toBe("96");
    expect(normalizeNumero("73,5")).toBe("73.5");
    expect(normalizeNumero("abc")).toBeNull();
  });

  it("separa e junta endereço e número", () => {
    expect(splitEndereco("Rua Ricardo Salazar, 45")).toEqual({
      endereco: "Rua Ricardo Salazar",
      numero: "45",
    });
    expect(splitEndereco("Rua Sem Número")).toEqual({ endereco: "Rua Sem Número", numero: null });
    expect(splitEndereco("Rua X, S/N")).toEqual({ endereco: "Rua X", numero: "S/N" });
    expect(splitEndereco(null)).toEqual({ endereco: null, numero: null });
    expect(joinEndereco("Rua X", "45")).toBe("Rua X, 45");
    expect(joinEndereco("Rua X", null)).toBe("Rua X");
  });

  it("compara nomes sem acento e caixa", () => {
    expect(normalizeNome("  São   Paulo ")).toBe(normalizeNome("sao paulo"));
  });
});
