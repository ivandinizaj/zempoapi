export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "Bad Request", message);
  }
}

export class GatewayError extends AppError {
  constructor(cause: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(502, "Bad Gateway", `Erro ao comunicar com o ZEMPO: ${msg}`);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "Not Found", message);
  }
}

/** O ZEMPO recebeu a requisição mas recusou a operação (ex: não confirmou a atualização). */
export class ZempoRejectedError extends AppError {
  constructor(message: string) {
    super(422, "Unprocessable Entity", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, "Forbidden", message);
  }
}
