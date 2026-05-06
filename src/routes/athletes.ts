import { Router } from "express";
import { getAthleteById, getAthleteByCode } from "../services/athleteService";
import { validateAthleteId, validateAtletaCodigo } from "../validators";
import { AppError, GatewayError, ValidationError } from "../errors/AppError";
import { asyncRoute } from "../middleware/asyncRoute";

const router = Router();

/**
 * @openapi
 * /atleta/{id}:
 *   get:
 *     tags: [Atletas]
 *     summary: Busca atleta por ID numérico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID numérico do atleta (ex: 79588)"
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Força atualização ignorando o cache
 *     responses:
 *       '200':
 *         description: Atleta encontrado
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
 *                   $ref: '#/components/schemas/Athlete'
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
    const err = validateAthleteId(id);
    if (err) throw new ValidationError(err);

    try {
      const { data, cached, _parsedAt } = await getAthleteById(id, req.query["refresh"] === "true");
      res.json({ success: true, _cached: cached, _parsedAt, data });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new GatewayError(e);
    }
  }),
);

/**
 * @openapi
 * /atleta/codigo/{codigo}:
 *   get:
 *     tags: [Atletas]
 *     summary: Busca atleta por código público
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: "Código público do atleta (ex: JU079588)"
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Força atualização ignorando o cache
 *     responses:
 *       '200':
 *         description: Atleta encontrado
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
 *                   $ref: '#/components/schemas/Athlete'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
router.get(
  "/codigo/:codigo",
  asyncRoute(async (req, res) => {
    const { codigo } = req.params;
    const err = validateAtletaCodigo(codigo);
    if (err) throw new ValidationError(err);

    try {
      const { data, cached, _parsedAt } = await getAthleteByCode(
        codigo,
        req.query["refresh"] === "true",
      );
      res.json({ success: true, _cached: cached, _parsedAt, data });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new GatewayError(e);
    }
  }),
);

export default router;
