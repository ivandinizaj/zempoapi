// Logger estruturado (JSON) via Pino — usado em auth, errorHandler e pelo pino-http no server.ts.
// pino-http loga automaticamente toda requisição HTTP recebida (método, path, status, duração, reqId).
// Para reduzir volume de logs em dev, defina LOG_LEVEL=warn no .env.
import pino from "pino";

const logger = pino({
  // Nível padrão "info" inclui logs de cada requisição. Use "warn" ou "error" para menos ruído.
  level: process.env.LOG_LEVEL ?? "info",
  base: { pid: false },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Impede que a API key apareça em texto claro nos logs estruturados.
  redact: {
    paths: ["req.headers['x-api-key']", "req.headers.authorization"],
    censor: "[redacted]",
  },
});

export default logger;
