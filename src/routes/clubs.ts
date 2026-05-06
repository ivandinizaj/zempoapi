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

/**
 * @openapi
 * /clubes:
 *   get:
 *     tags: [Clubes]
 *     summary: Lista clubes com filtros opcionais
 *     parameters:
 *       - in: query
 *         name: filtro
 *         schema:
 *           type: string
 *         description: "Sigla do estado para filtrar (ex: SP, RJ, MG)"
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [ASC, DESC, '']
 *         description: Ordenação por nome do clube
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Força atualização ignorando o cache
 *     responses:
 *       '200':
 *         description: Lista de clubes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 _cached:
 *                   type: boolean
 *                 _parsedAt:
 *                   type: string
 *                   format: date-time
 *                 pagina:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Club'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
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

/**
 * @openapi
 * /clubes/{id}:
 *   get:
 *     tags: [Clubes]
 *     summary: Detalhes de um clube por ID ou código
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID numérico ou código do clube (ex: 2294 ou CL002294)"
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Força atualização ignorando o cache
 *     responses:
 *       '200':
 *         description: Detalhes do clube
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 _cached:
 *                   type: boolean
 *                 _parsedAt:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/ClubDetails'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
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
