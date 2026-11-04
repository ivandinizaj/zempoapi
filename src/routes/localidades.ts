import { Router } from "express";
import { getBairros, getCidades } from "../services/localidadesService";
import { validateCidadeId, validateFiltroEstado } from "../validators";
import { ValidationError } from "../errors/AppError";
import { asyncRoute } from "../middleware/asyncRoute";
import { getValidSiglas, siglaToFiltro } from "../utils/estadoMapper";

const router = Router();

/**
 * @openapi
 * /localidades/estados:
 *   get:
 *     tags: [Localidades]
 *     summary: Lista de estados (sigla e ID ZEMPO)
 *     responses:
 *       '200':
 *         description: Estados
 */
router.get("/estados", (_req, res) => {
  const data = getValidSiglas().map((sigla) => ({ id: String(siglaToFiltro(sigla)), sigla }));
  // lista estática (estadoMapper), não vem do ZEMPO
  res.json({ success: true, _cached: false, data });
});

/**
 * @openapi
 * /localidades/estados/{uf}/cidades:
 *   get:
 *     tags: [Localidades]
 *     summary: Cidades de um estado
 *     parameters:
 *       - in: path
 *         name: uf
 *         required: true
 *         schema: { type: string, example: PE }
 *       - in: query
 *         name: refresh
 *         schema: { type: boolean }
 *     responses:
 *       '200':
 *         description: "Lista de { id, nome }"
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
router.get(
  "/estados/:uf/cidades",
  asyncRoute(async (req, res) => {
    const err = validateFiltroEstado(req.params.uf);
    if (err) throw new ValidationError(err);

    const { data, cached, _parsedAt } = await getCidades(
      req.params.uf,
      req.query["refresh"] === "true",
    );
    res.json({ success: true, _cached: cached, _parsedAt, data });
  }),
);

/**
 * @openapi
 * /localidades/cidades/{id}/bairros:
 *   get:
 *     tags: [Localidades]
 *     summary: Bairros de uma cidade
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "5406" }
 *         description: ID ZEMPO da cidade (ver /localidades/estados/{uf}/cidades)
 *       - in: query
 *         name: refresh
 *         schema: { type: boolean }
 *     responses:
 *       '200':
 *         description: "Lista de { id, nome }"
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
router.get(
  "/cidades/:id/bairros",
  asyncRoute(async (req, res) => {
    const err = validateCidadeId(req.params.id);
    if (err) throw new ValidationError(err);

    const { data, cached, _parsedAt } = await getBairros(
      req.params.id,
      req.query["refresh"] === "true",
    );
    res.json({ success: true, _cached: cached, _parsedAt, data });
  }),
);

export default router;
