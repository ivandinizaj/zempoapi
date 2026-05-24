import { Router } from "express";
import { version } from "../../package.json";
import sessionCache from "../cache/SessionCache";
import atletasCache from "../cache/atletasCache";
import clubesCache from "../cache/clubesCache";
import clubDetailsCache from "../cache/clubDetailsCache";
import { getKeyStats } from "../middleware/keyMetrics";

const router = Router();

/**
 * @openapi
 * /status:
 *   get:
 *     tags: [Admin]
 *     summary: Status da API, sessão ZEMPO e caches
 *     responses:
 *       '200':
 *         description: Status atual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 api: { type: string }
 *                 version: { type: string }
 *                 session: { $ref: '#/components/schemas/SessionInfo' }
 *                 caches:
 *                   type: object
 *                   properties:
 *                     atletas: { $ref: '#/components/schemas/CacheStats' }
 *                     clubes: { $ref: '#/components/schemas/CacheStats' }
 *                     clubesDetalhes: { $ref: '#/components/schemas/CacheStats' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/status", (_req, res) => {
  res.json({
    success: true,
    api: "ZEMPO CBJ API",
    version,
    session: sessionCache.getInfo(),
    caches: {
      atletas: atletasCache.getStats(),
      clubes: clubesCache.getStats(),
      clubesDetalhes: clubDetailsCache.getStats(),
    },
    keys: getKeyStats(),
    config: {
      sessionTTL: parseInt(process.env.SESSION_CACHE_TTL ?? "3600"),
      atletasTTL: parseInt(process.env.USER_DATA_CACHE_TTL ?? "3600"),
      clubesTTL: parseInt(process.env.CLUBES_CACHE_TTL ?? "172800"),
      clubeDetalhesTTL: parseInt(process.env.CLUB_DETAILS_CACHE_TTL ?? "86400"),
      baseUrl: process.env.ZEMPO_BASE_URL ?? "https://zempo.com.br",
    },
  });
});

/**
 * @openapi
 * /cache/invalidate/{id}:
 *   post:
 *     tags: [Admin]
 *     summary: Invalida o cache de um atleta específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do atleta cujo cache será invalidado
 *     responses:
 *       '200':
 *         description: Cache invalidado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/cache/invalidate/:id", (req, res) => {
  const { id } = req.params;
  const removed = atletasCache.invalidate(id);
  res.json({
    success: true,
    message: removed
      ? `Cache do atleta ${id} invalidado`
      : `Nenhuma entrada encontrada para o atleta ${id}`,
  });
});

/**
 * @openapi
 * /cache/flush:
 *   post:
 *     tags: [Admin]
 *     summary: Limpa todo o cache (atletas, clubes e detalhes)
 *     responses:
 *       '200':
 *         description: Cache limpo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/cache/flush", (_req, res) => {
  const atletas = atletasCache.flush();
  const clubes = clubesCache.flush();
  const clubDetalhes = clubDetailsCache.flush();
  res.json({
    success: true,
    message: `Cache limpo — ${atletas} atleta(s), ${clubes} consulta(s) de clubes e ${clubDetalhes} detalhe(s) de clube removidos`,
  });
});

/**
 * @openapi
 * /session/invalidate:
 *   post:
 *     tags: [Admin]
 *     summary: Invalida a sessão ZEMPO e força novo login na próxima requisição
 *     responses:
 *       '200':
 *         description: Sessão invalidada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/session/invalidate", (_req, res) => {
  sessionCache.invalidate();
  res.json({
    success: true,
    message: "Sessão invalidada. Um novo login será feito na próxima requisição.",
  });
});

export default router;
