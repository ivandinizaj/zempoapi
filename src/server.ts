import "dotenv/config";
import express from "express";
import morgan from "morgan";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3000;
const API_VERSION = "v1";

app.use(express.json());
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// "*" só em dev (sem API_KEY); em prod, definir CORS_ORIGIN explicitamente
const corsOrigin = process.env.CORS_ORIGIN ?? (process.env.API_KEY ? "" : "*");

app.use((req, res, next) => {
  if (corsOrigin) res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Headers", "X-API-Key, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

app.get("/", (_req, res) => {
  res.json({
    name: "ZEMPO CBJ API",
    description: "API não oficial para consulta de dados do ZEMPO - Confederação Brasileira de Judô",
    version: "1.0.0",
    endpoints: {
      [`GET /api/${API_VERSION}/atleta/:id`]: "Busca atleta por ID numérico",
      [`GET /api/${API_VERSION}/atleta/codigo/:codigo`]: "Busca atleta por código (ex: JU079588)",
      [`GET /api/${API_VERSION}/clubes`]: "Lista clubes com filtro opcional por estado",
      [`GET /api/${API_VERSION}/status`]: "Status da API, sessão e cache",
      [`POST /api/${API_VERSION}/cache/invalidate/:id`]: "Invalida cache de um atleta",
      [`POST /api/${API_VERSION}/cache/flush`]: "Limpa todo o cache",
      [`POST /api/${API_VERSION}/session/invalidate`]: "Força novo login no ZEMPO",
    },
    auth: process.env.API_KEY
      ? "API Key necessária (header X-API-Key ou ?api_key=)"
      : "Sem autenticação (defina API_KEY no .env para habilitar)",
  });
});

app.use(`/api/${API_VERSION}`, apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🥋 ZEMPO CBJ API rodando em http://localhost:${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/${API_VERSION}/status`);
  console.log(
    `🔑 Auth: ${process.env.API_KEY ? "API Key ativa" : "Sem autenticação (dev mode)"}\n`,
  );
});

export default app;
