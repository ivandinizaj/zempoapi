import type { NextFunction, Request, Response } from "express";
import { errorHandler } from "../errorHandler";
import { getKeyStats, recordRequest } from "../keyMetrics";
import { GatewayError, ValidationError } from "../../errors/AppError";
import logger from "../../utils/logger";

jest.mock("../../utils/logger", () => ({ __esModule: true, default: { error: jest.fn() } }));

function mockRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function handle(err: Error, req: Partial<Request> = {}) {
  const res = mockRes();
  errorHandler(err, { method: "GET", path: "/x", ...req } as Request, res as unknown as Response, jest.fn() as NextFunction);
  return res;
}

beforeEach(() => jest.clearAllMocks());

describe("errorHandler", () => {
  test("AppError usa status e título próprios, sem log de erro", () => {
    const res = handle(new ValidationError("pagina inválida"));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Bad Request", message: "pagina inválida" });
    expect(logger.error).not.toHaveBeenCalled();
  });

  test("GatewayError vira 502 com a causa na mensagem", () => {
    const res = handle(new GatewayError("timeout"));

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: "Bad Gateway",
      message: "Erro ao comunicar com o ZEMPO: timeout",
    });
  });

  test("erro inesperado vira 500, é logado e contabilizado para a key", () => {
    recordRequest("app-teste");
    const before = getKeyStats()["app-teste"].errors;

    const res = handle(new Error("bug"), { keyLabel: "app-teste" });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error", message: "bug" });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(getKeyStats()["app-teste"].errors).toBe(before + 1);
  });

  test("erro de validação (4xx) não conta como erro da key", () => {
    recordRequest("app-4xx");

    handle(new ValidationError("x"), { keyLabel: "app-4xx" });

    expect(getKeyStats()["app-4xx"].errors).toBe(0);
  });
});
