import { Router } from "express";
import { getClubes } from "../services/clubsService";
import { validatePagina, validateOrdem, validateFiltroEstado } from "../validators";
import { AppError, GatewayError, ValidationError } from "../errors/AppError";
import { asyncRoute } from "../middleware/asyncRoute";
import { siglaToFiltro } from "../utils/estadoMapper";

const router = Router();

router.get(
  "/",
  asyncRoute(async (req, res) => {
    const { filtro, ordem = "" } = req.query as Record<string, string>;
    const pagina = parseInt((req.query["pagina"] as string) ?? "1") || 1;

    const paginaErr = validatePagina(pagina);
    if (paginaErr) throw new ValidationError(paginaErr);

    const ordemErr = validateOrdem(ordem);
    if (ordemErr) throw new ValidationError(ordemErr);

    if (filtro) {
      const filtroErr = validateFiltroEstado(filtro);
      if (filtroErr) throw new ValidationError(filtroErr);
    }

    const filtroNumerico = filtro ? siglaToFiltro(filtro) ?? undefined : undefined;
    const forceRefresh = req.query["refresh"] === "true";

    try {
      const { data, cached } = await getClubes({
        filtro: filtroNumerico,
        ordem,
        pagina,
        forceRefresh,
      });
      res.json({
        success: true,
        _cached: cached,
        _parsedAt: data._parsedAt,
        pagina: data.pagina,
        total: data.total,
        data: data.clubes,
      });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new GatewayError(e);
    }
  }),
);

export default router;
