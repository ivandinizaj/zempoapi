import { fetchPage, postForm, postPage } from "../../http/zempoClient";
import { getAthleteEditData, updateAthleteProfile } from "../athleteEditService";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ZempoRejectedError,
} from "../../errors/AppError";
import { ATHLETE_EDIT_PAGE } from "../../parsers/__tests__/fixtures/athleteEditPage";

jest.mock("../../http/zempoClient", () => ({
  BASE_URL: "https://zempo.test",
  fetchPage: jest.fn(),
  postForm: jest.fn(),
  postPage: jest.fn(),
}));

const mockFetchPage = jest.mocked(fetchPage);
const mockPostForm = jest.mocked(postForm);
const mockPostPage = jest.mocked(postPage);

const sentBody = () => mockPostPage.mock.calls[0][1].body.toString("latin1");

beforeEach(() => {
  jest.resetAllMocks();
  mockFetchPage.mockResolvedValue(ATHLETE_EDIT_PAGE);
  mockPostPage.mockResolvedValue(ATHLETE_EDIT_PAGE);
});

describe("getAthleteEditData", () => {
  it("expõe só id, nome e dados", async () => {
    const { data } = await getAthleteEditData("12345");
    expect(Object.keys(data)).toEqual(["id", "nomeCompleto", "dados"]);
    expect(data.nomeCompleto).toBe("Maria José Souza");
  });

  it("404 sem formulário e 403 com formulário vazio", async () => {
    mockFetchPage.mockResolvedValueOnce("<html>nada</html>");
    await expect(getAthleteEditData("1")).rejects.toBeInstanceOf(NotFoundError);

    mockFetchPage.mockResolvedValueOnce(ATHLETE_EDIT_PAGE.replace(" Maria   José Souza ", ""));
    await expect(getAthleteEditData("1")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("updateAthleteProfile", () => {
  it("envia as alterações e a categoria do novo peso", async () => {
    mockPostForm.mockResolvedValue("7&Meio-Médio");

    const { data } = await updateAthleteProfile("12345", {
      email: "nova@example.com",
      peso: "81.5",
    });

    expect(mockPostForm.mock.calls[0][1]).toMatchObject({ peso: "81.5", sexo: "1" });
    expect(sentBody()).toContain('name="email"\r\n\r\nnova@example.com\r\n');
    expect(sentBody()).toContain('name="categoria"\r\n\r\n7\r\n');
    expect(data.sucesso).toBe(true);
    // a resposta simulada é o formulário antigo: nada foi aplicado
    expect(data.naoAplicados).toEqual(["email", "peso"]);
  });

  it("não envia nada ao limpar campo obrigatório", async () => {
    await expect(updateAthleteProfile("12345", { email: "" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(mockPostPage).not.toHaveBeenCalled();
  });

  it("rejeita peso sem categoria", async () => {
    mockPostForm.mockResolvedValue("");
    await expect(updateAthleteProfile("12345", { peso: "300" })).rejects.toThrow(
      /nenhuma categoria/,
    );
    expect(mockPostPage).not.toHaveBeenCalled();
  });

  it("422 quando o ZEMPO não confirma a atualização", async () => {
    mockPostPage.mockResolvedValue(
      ATHLETE_EDIT_PAGE.replace("Atleta atualizado com sucesso!", "Erro ao salvar"),
    );
    await expect(updateAthleteProfile("12345", { complemento: "Apto 1" })).rejects.toBeInstanceOf(
      ZempoRejectedError,
    );
  });
});
