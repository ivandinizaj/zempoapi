import fs from "fs";
import path from "path";
import { parseUserData } from "../athleteParser";
import { isSessionExpiredHtml } from "../../utils/session";

const EXAMPLES_DIR = path.join(__dirname, "../../../example");

function loadHtml(filename: string): string {
  return fs.readFileSync(path.join(EXAMPLES_DIR, filename), "utf8");
}

describe("isSessionExpiredHtml", () => {
  test("retorna true quando html tem redirect para /portal", () => {
    expect(isSessionExpiredHtml('<script>window.top.location.href = "/portal"</script>')).toBe(true);
  });

  test("retorna false para html normal", () => {
    expect(isSessionExpiredHtml("<html><body>dados</body></html>")).toBe(false);
  });
});

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

    test("extrai idade", () => {
      expect(typeof result.idade).toBe("number");
      expect(result.idade).toBeGreaterThan(0);
    });

    test("extrai nacionalidade", () => {
      expect(result.nacionalidade).toBe("Brasileira");
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

  describe("campos não devem ser nulos", () => {
    test.each([
      "id", "codigo", "nomeCompleto", "federacao", "registroFederacao",
      "clube", "graduacao", "dataUltimaGraduacao", "situacaoFederacao", "situacaoCBJ",
    ])("%s não é null", (campo: string) => {
      expect((result as unknown as Record<string, unknown>)[campo]).not.toBeNull();
    });
  });
});
