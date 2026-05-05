import { Router } from "express";
import { getClubes } from "../services/clubsService";
import { getClubDetails } from "../services/clubDetailsService";
import {
  validatePagina,
  validateOrdem,
  validateFiltroEstado,
  validateClubId,
} from "../validators";
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

    const filtroNumerico = filtro
      ? (siglaToFiltro(filtro) ?? undefined)
      : undefined;
    const forceRefresh = req.query["refresh"] === "true";

    try {
      const { data, cached, _parsedAt } = await getClubes({
        filtro: filtroNumerico,
        ordem,
        pagina,
        forceRefresh,
      });
      res.json({
        success: true,
        _cached: cached,
        _parsedAt,
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

router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const { id } = req.params;

    const idErr = validateClubId(id);
    if (idErr) throw new ValidationError(idErr);

    const forceRefresh = req.query["refresh"] === "true";

    try {
      const { data, cached, _parsedAt } = await getClubDetails(id, { forceRefresh });
      res.json({
        success: true,
        _cached: cached,
        _parsedAt,
        data,
      });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new GatewayError(e);
    }
  }),
);

export default router;
