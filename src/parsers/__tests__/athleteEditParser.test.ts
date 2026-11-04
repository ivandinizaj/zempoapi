import { extractAviso, extractFormHtml, parseAthleteEditForm } from "../athleteEditParser";
import { buildMultipartLatin1 } from "../../utils/multipart";
import { validateAthleteUpdateBody, validateRequiredEditFields } from "../../validators";
import { parseAthleteId } from "../../utils/coding";
import { normalizeAthleteUpdate } from "../../domain/athleteEdit/fields";
import { resolveAthleteChanges } from "../../services/athleteEditService";
import { ATHLETE_EDIT_PAGE } from "./fixtures/athleteEditPage";

const PAGE = ATHLETE_EDIT_PAGE;

describe("extractFormHtml / extractAviso", () => {
  it("recorta apenas o formulário de edição", () => {
    const form = extractFormHtml(PAGE)!;
    expect(form.startsWith('<form id="formulario"')).toBe(true);
    expect(form.endsWith("</form>")).toBe(true);
    expect(form).not.toContain("<script>");
  });

  it("retorna null quando não há formulário", () => {
    expect(extractFormHtml("<html><body>sem permissão</body></html>")).toBeNull();
  });

  it("lê o aviso de sucesso", () => {
    expect(extractAviso(PAGE)).toBe("Atleta atualizado com sucesso!");
    expect(extractAviso("<div>nada</div>")).toBeNull();
  });
});

describe("parseAthleteEditForm", () => {
  const form = parseAthleteEditForm(PAGE)!;

  it("extrai id, nome, cidade e _parsedAt", () => {
    expect(form.id).toBe("12345");
    expect(form.nomeCompleto).toBe("Maria José Souza");
    expect(form.cidadeId).toBe("5406");
    expect(form._parsedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("retorna nomeCompleto null quando a sessão não tem permissão (formulário vazio)", () => {
    // Estrutura reduzida da página real que o ZEMPO devolve para atleta de outro usuário
    const semPermissao = `
<form id="formulario" action="?secao=pessoas_editar&amp;acao=atualizar&amp;id=1">
  <table id="dados_basicos"><tbody>
    <tr bgcolor="#F4F4F4">
      <td class="azul"><div align="right"><strong>Nome Completo</strong></div></td>
      <td colspan="2"><span class="fonte13"><strong></strong></span></td>
    </tr>
    <tr><td><input type="hidden" name="federacao" id="federacao" value=""></td></tr>
    <tr><td><input name="rg_data" type="text" id="rg_data" value="0000-00-00"></td></tr>
    <tr><td><input name="email" type="text" id="email" value=""></td></tr>
  </tbody></table>
</form>`;
    const vazio = parseAthleteEditForm(semPermissao)!;
    expect(vazio).not.toBeNull();
    expect(vazio.nomeCompleto).toBeNull();
    expect(vazio.dados.email).toBeNull();
  });

  it("serializa como o navegador (ordem, duplicatas, file, image, disabled)", () => {
    const names = form.entries.map((e) => e.name);
    expect(names.slice(0, 2)).toEqual(["graduacao_antes", "graduacao_antes"]);
    expect(names).not.toContain("bloqueado");
    expect(names.slice(-2)).toEqual(["imageField.x", "imageField.y"]);
    expect(form.entries.find((e) => e.name === "foto")).toEqual({
      name: "foto",
      value: "",
      isFile: true,
    });
    expect(form.entries.find((e) => e.name === "ingles")?.value).toBe("0");
    expect(form.entries.find((e) => e.name === "estado")?.value).toBe("17");
  });

  it("converte os dados para o formato da API", () => {
    expect(form.dados).toMatchObject({
      peso: "73",
      email: "maria@example.com",
      celular: "(81)99999-0000",
      rgEstadoEmissor: "PE",
      rgDataExpedicao: "01/02/2010",
      passaporte: null,
      endereco: "Rua A",
      numero: "45",
      complemento: null,
      estado: "PE",
      cidade: "Recife",
      bairro: "Madalena",
    });
  });

  it("lista os campos obrigatórios do ZEMPO", () => {
    expect(form.obrigatorios).toEqual(
      expect.arrayContaining(["peso", "email", "endereco", "estado"]),
    );
    expect(form.obrigatorios).not.toContain("complemento");
  });
});

describe("buildMultipartLatin1", () => {
  it("codifica em latin1 e mantém parte de arquivo vazia", () => {
    const { body, contentType } = buildMultipartLatin1([
      { name: "mae", value: "Conceição 😀", isFile: false },
      { name: "foto", value: "", isFile: true },
    ]);
    const boundary = contentType.split("boundary=")[1];
    const text = body.toString("latin1");
    expect(body.includes(Buffer.from("Conceição", "latin1"))).toBe(true);
    expect(text).toContain("&#128512;");
    expect(text).toContain('name="foto"; filename=""\r\nContent-Type: application/octet-stream');
    expect(text.endsWith(`--${boundary}--\r\n`)).toBe(true);
  });
});

describe("validateAthleteUpdateBody", () => {
  it("aceita body válido", () => {
    expect(
      validateAthleteUpdateBody({
        email: "a@b.com",
        peso: 70.5,
        complemento: null,
        cpf: "529.982.247-25",
        cep: "50720123",
        celular: "81999990000",
        rgDataExpedicao: "2009-06-18",
        rgEstadoEmissor: "pe",
      }),
    ).toBeNull();
  });

  it("rejeita estrutura e campos desconhecidos", () => {
    expect(validateAthleteUpdateBody({})).toMatch(/Nenhum campo/);
    expect(validateAthleteUpdateBody([])).not.toBeNull();
    expect(validateAthleteUpdateBody({ sexo: "2" })).toMatch(/não editáveis.*sexo/);
    expect(validateAthleteUpdateBody({ email: { x: 1 } })).toMatch(/email/);
  });

  it("rejeita chaves herdadas do prototype", () => {
    const body = JSON.parse('{"toString":"x","constructor":"y","__proto__":"z"}') as Record<
      string,
      string
    >;
    expect(validateAthleteUpdateBody(body)).toMatch(/não editáveis.*toString.*constructor/);
    expect(normalizeAthleteUpdate(body)).toEqual({});
  });

  it("rejeita formatos inválidos", () => {
    expect(validateAthleteUpdateBody({ email: "x" })).toMatch(/email inválido/);
    expect(validateAthleteUpdateBody({ cpf: "111.111.111-11" })).toMatch(/CPF inválido/);
    expect(validateAthleteUpdateBody({ cep: "123" })).toMatch(/8 dígitos/);
    expect(validateAthleteUpdateBody({ celular: "9999" })).toMatch(/DDD/);
    expect(validateAthleteUpdateBody({ rgDataExpedicao: "31/02/2010" })).toMatch(/data inválida/);
    expect(validateAthleteUpdateBody({ peso: "abc" })).toMatch(/numérico/);
    expect(validateAthleteUpdateBody({ rgEstadoEmissor: "XX" })).toMatch(/sigla/);
  });

  it("exige a cadeia estado → cidade → bairro", () => {
    expect(validateAthleteUpdateBody({ estado: "SP" })).toMatch(/cidade e bairro/);
    expect(validateAthleteUpdateBody({ cidade: "Olinda" })).toMatch(/bairro/);
    expect(
      validateAthleteUpdateBody({ estado: "SP", cidade: "Santos", bairro: "Gonzaga" }),
    ).toBeNull();
    expect(validateAthleteUpdateBody({ cidade: null, bairro: "x" })).toMatch(/cidade: não pode/);
  });
});

describe("normalizeAthleteUpdate", () => {
  it("aplica as máscaras do ZEMPO", () => {
    expect(
      normalizeAthleteUpdate({
        cpf: "52998224725",
        cep: "50720123",
        celular: "81 99999-0000",
        telefone: "8133334444",
        rgDataExpedicao: "2009-06-18",
        peso: "73,5",
        email: " A@B.COM ",
        rgEstadoEmissor: "pe",
        complemento: null,
      }),
    ).toEqual({
      cpf: "529.982.247-25",
      cep: "50720-123",
      celular: "(81)99999-0000",
      telefone: "(81)3333-4444",
      rgDataExpedicao: "18/06/2009",
      peso: "73.5",
      email: "a@b.com",
      rgEstadoEmissor: "PE",
      complemento: "",
    });
  });
});

describe("validateRequiredEditFields", () => {
  it("impede limpar campos obrigatórios", () => {
    const { obrigatorios } = parseAthleteEditForm(PAGE)!;
    expect(validateRequiredEditFields({ email: "" }, obrigatorios)).toMatch(/email/);
    expect(validateRequiredEditFields({ complemento: "" }, obrigatorios)).toBeNull();
    expect(validateRequiredEditFields({ numero: "" }, obrigatorios)).toBeNull();
  });
});

describe("resolveAthleteChanges", () => {
  const form = parseAthleteEditForm(PAGE)!;

  it("concatena endereço + número e converte UF em ID", async () => {
    const { changes, erros } = await resolveAthleteChanges(form, {
      numero: "100",
      rgEstadoEmissor: "SP",
      email: "nova@example.com",
    });
    expect(erros).toEqual([]);
    expect(changes).toEqual({ endereco: "Rua A, 100", rg_estado: "25", email: "nova@example.com" });
  });

  it("usa o número atual quando só o logradouro muda", async () => {
    const { changes } = await resolveAthleteChanges(form, { endereco: "Av. Brasil" });
    expect(changes.endereco).toBe("Av. Brasil, 45");
  });
});

describe("parseAthleteId", () => {
  it("aceita ID numérico ou código JU, removendo zeros", () => {
    expect(parseAthleteId("79588")).toBe("79588");
    expect(parseAthleteId("JU079588")).toBe("79588");
    expect(parseAthleteId("ju079588")).toBe("79588");
    expect(parseAthleteId("abc")).toBeNull();
    expect(parseAthleteId("000")).toBeNull();
  });
});
