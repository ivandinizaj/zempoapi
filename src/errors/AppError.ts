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
