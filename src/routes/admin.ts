import { Router } from "express";
import sessionCache from "../cache/SessionCache";
import atletasCache from "../cache/atletasCache";
import clubesCache from "../cache/clubesCache";
import clubDetailsCache from "../cache/clubDetailsCache";

const router = Router();

router.get("/status", (_req, res) => {
  res.json({
    success: true,
    api: "ZEMPO CBJ API",
    version: "1.0.0",
    session: sessionCache.getInfo(),
    caches: {
      atletas: atletasCache.getStats(),
      clubes: clubesCache.getStats(),
      clubesDetalhes: clubDetailsCache.getStats(),
    },
    config: {
      sessionTTL: parseInt(process.env.SESSION_CACHE_TTL ?? "3600"),
      atletasTTL: parseInt(process.env.USER_DATA_CACHE_TTL ?? "3600"),
      clubesTTL: parseInt(process.env.CLUBES_CACHE_TTL ?? "172800"),
      clubeDetalhesTTL: parseInt(process.env.CLUB_DETAILS_CACHE_TTL ?? "86400"),
      baseUrl: process.env.ZEMPO_BASE_URL ?? "https://zempo.com.br",
    },
  });
});

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

router.post("/cache/flush", (_req, res) => {
  const atletas = atletasCache.flush();
  const clubes = clubesCache.flush();
  const clubDetalhes = clubDetailsCache.flush();
  res.json({
    success: true,
    message: `Cache limpo — ${atletas} atleta(s), ${clubes} consulta(s) de clubes e ${clubDetalhes} detalhe(s) de clube removidos`,
  });
});

router.post("/session/invalidate", (_req, res) => {
  sessionCache.invalidate();
  res.json({
    success: true,
    message: "Sessão invalidada. Um novo login será feito na próxima requisição.",
  });
});

export default router;
