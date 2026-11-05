import fs from "fs";
import path from "path";
import { parseUserData } from "../athleteParser";

const EXAMPLES_DIR = path.join(__dirname, "../../../example");

function loadHtml(filename: string): string {
  return fs.readFileSync(path.join(EXAMPLES_DIR, filename), "utf8");
}

describe("parseUserData - JU079588 (Ivan Diniz, regular)", () => {
  let result: ReturnType<typeof parseUserData>;

  beforeAll(() => {
    result = parseUserData(loadHtml("zempo-user-JU079588.html"));
  });

  describe("identificação", () => {
    test("extrai id numérico", () => {
      expect(result.id).toBe("079588");
    });

    test("extrai código público", () => {
      expect(result.codigo).toBe("JU079588");
    });

    test("extrai nomeCompleto contendo o nome", () => {
      expect(result.nomeCompleto).toContain("Ivan Diniz");
    });

    test("extrai primeiroNome", () => {
      expect(result.primeiroNome).toBe("Ivan");
    });
  });

  describe("filiação", () => {
    test("extrai federacao", () => {
      expect(result.federacao).toBe("FPJU - PE");
    });

    test("extrai registroFederacao", () => {
      expect(result.registroFederacao).toBe("12/01/2015");
    });

    test("extrai clube contendo o nome do clube", () => {
      expect(result.clube).toContain("INSTITUTO IKIGAI");
    });
  });

  describe("graduação", () => {
    test("extrai graduacao contendo Preta e DAN", () => {
      expect(result.graduacao).toContain("Preta");
      expect(result.graduacao).toContain("DAN");
    });

    test("extrai dataUltimaGraduacao", () => {
      expect(result.dataUltimaGraduacao).toBe("13/12/2025");
    });
  });

  describe("situação", () => {
    test("extrai situacaoFederacao como regular", () => {
      expect(result.situacaoFederacao).toBe("regular");
    });

    test("extrai situacaoCBJ como regular", () => {
      expect(result.situacaoCBJ).toBe("regular");
    });
  });

  describe("dados pessoais", () => {
    test("extrai genero", () => {
      expect(result.genero).toBe("masculino");
    });

    test("extrai dataNascimento", () => {
      expect(result.dataNascimento).toBe("01/12/1993");
    });

    test("extrai idade informada pelo ZEMPO", () => {
      expect(result.idade).toBe(32);
    });

    test("extrai nacionalidade", () => {
      expect(result.nacionalidade).toBe("Brasileira");
    });

    test("extrai naturalidade", () => {
      expect(result.naturalidade).toBe("Pernambuco");
    });
  });

  describe("competição", () => {
    test("extrai peso com unidade", () => {
      expect(result.peso).toBe("80.00 kg");
    });

    test("extrai categoria de peso", () => {
      expect(result.categoria).toMatch(/^Meio-M.dio$/);
    });
  });

  describe("contato e documentos", () => {
    test("extrai email, celular e email do técnico", () => {
      expect(result.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(result.celular).toMatch(/^\(\d{2}\)\d{4,5}-\d{4}$/);
      expect(result.emailTecnico).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test("telefone residencial ausente retorna null", () => {
      expect(result.telefone).toBeNull();
    });

    test("extrai cpf", () => {
      expect(result.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });

    test("extrai status e seleção brasileira", () => {
      expect(result.status).toBe("Ativo");
      expect(result.selecaoBrasileira).toBe("não");
    });
  });

  describe("foto", () => {
    test("resolve caminho relativo com a URL padrão do ZEMPO", () => {
      expect(result.foto).toMatch(/^https:\/\/zempo\.com\.br\/arquivos\/pessoas\/.+\.jpg$/);
    });

    test("usa o baseUrl informado", () => {
      const comBase = parseUserData(loadHtml("zempo-user-JU079588.html"), "https://zempo.test");
      expect(comBase.foto).toMatch(/^https:\/\/zempo\.test\/arquivos\/pessoas\//);
    });
  });

  describe("campos não devem ser nulos", () => {
    test.each([
      "id", "codigo", "nomeCompleto", "federacao", "registroFederacao",
      "clube", "graduacao", "dataUltimaGraduacao", "situacaoFederacao", "situacaoCBJ",
    ])("%s não é null", (campo: string) => {
      expect((result as unknown as Record<string, unknown>)[campo]).not.toBeNull();
    });
  });
});

describe("parseUserData - JU088150 (Adriane Rosas, irregular)", () => {
  let result: ReturnType<typeof parseUserData>;

  beforeAll(() => {
    result = parseUserData(loadHtml("zempo-user-JU088150.html"));
  });

  describe("identificação", () => {
    test("extrai id numérico", () => {
      expect(result.id).toBe("088150");
    });

    test("extrai código público", () => {
      expect(result.codigo).toBe("JU088150");
    });

    test("extrai nomeCompleto", () => {
      expect(result.nomeCompleto).toBe("Adriane Rosas da Silva");
    });
  });

  describe("filiação", () => {
    test("extrai federacao", () => {
      expect(result.federacao).toBe("FSJ - SE");
    });

    test("extrai registroFederacao", () => {
      expect(result.registroFederacao).toBe("29/05/2019");
    });

    test("extrai clube", () => {
      expect(result.clube).toContain("ASSOCIACAO DURVAL AMERICO");
    });
  });

  describe("graduação", () => {
    test("extrai graduacao Cinza (sem DAN)", () => {
      expect(result.graduacao).toBe("Cinza");
    });

    test("extrai dataUltimaGraduacao", () => {
      expect(result.dataUltimaGraduacao).toBe("28/05/2019");
    });
  });

  describe("situação", () => {
    test("extrai situacaoFederacao como irregular", () => {
      expect(result.situacaoFederacao).toBe("irregular");
    });

    test("extrai situacaoCBJ como irregular", () => {
      expect(result.situacaoCBJ).toBe("irregular");
    });
  });

  describe("dados pessoais", () => {
    test("extrai genero feminino", () => {
      expect(result.genero).toBe("feminino");
    });

    test("extrai dataNascimento e idade", () => {
      expect(result.dataNascimento).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(result.idade).toBeGreaterThan(0);
    });
  });

  describe("campos que o ZEMPO não exibe neste perfil", () => {
    test.each(["email", "celular", "telefone", "emailTecnico", "cpf", "status", "selecaoBrasileira"])(
      "%s é null (não string vazia)",
      (campo) => {
        expect((result as unknown as Record<string, unknown>)[campo]).toBeNull();
      },
    );
  });

  describe("campos não devem ser nulos", () => {
    test.each([
      "id", "codigo", "nomeCompleto", "federacao", "registroFederacao",
      "clube", "graduacao", "dataUltimaGraduacao", "situacaoFederacao", "situacaoCBJ",
    ])("%s não é null", (campo: string) => {
      expect((result as unknown as Record<string, unknown>)[campo]).not.toBeNull();
    });
  });
});

describe("parseUserData - página sem dados", () => {
  // Ex.: ID inexistente ou layout alterado — nenhum campo pode virar "" ou undefined.
  test("todos os campos de domínio são null", () => {
    const { _parsedAt, ...campos } = parseUserData("<html><body><table></table></body></html>");

    expect(_parsedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    for (const [campo, valor] of Object.entries(campos)) {
      expect([campo, valor]).toEqual([campo, null]);
    }
  });
});

describe("parseUserData - variações de layout", () => {
  const html = `
    <table><tr>
      <td class="azul">Graduação</td>
      <td><img src="img/graduacoes/marrom.png" alt=" Marrom "></td>
    </tr><tr>
      <td>Data da última graduação</td><td>10/10/2020</td>
    </tr><tr>
      <td><span class="azul">Telefone residencial</span></td><td>(81)3333-4444</td>
    </tr></table>`;
  const result = parseUserData(html);

  test("graduação cai para o alt da imagem quando não há span.fonte13", () => {
    expect(result.graduacao).toBe("Marrom");
  });

  test("data da graduação cai para o label quando não há input", () => {
    expect(result.dataUltimaGraduacao).toBe("10/10/2020");
  });

  test("extrai telefone residencial com label marcado por span.azul", () => {
    expect(result.telefone).toBe("(81)3333-4444");
  });
});
