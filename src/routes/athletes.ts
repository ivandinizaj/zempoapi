import { Router } from "express";
import { getAthleteById, getAthleteByCode } from "../services/athleteService";
import { validateAthleteId, validateAtletaCodigo } from "../validators";
import { AppError, GatewayError, ValidationError } from "../errors/AppError";
import { asyncRoute } from "../middleware/asyncRoute";

const router = Router();

router.get("/:id", asyncRoute(async (req, res) => {
  const { id } = req.params;
  const err = validateAthleteId(id);
  if (err) throw new ValidationError(err);

  try {
    const { data, cached } = await getAthleteById(id, req.query["refresh"] === "true");
    res.json({ success: true, _cached: cached, data });
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new GatewayError(e);
  }
}));

router.get("/codigo/:codigo", asyncRoute(async (req, res) => {
  const { codigo } = req.params;
  const err = validateAtletaCodigo(codigo);
  if (err) throw new ValidationError(err);

  try {
    const { data, cached } = await getAthleteByCode(codigo, req.query["refresh"] === "true");
    res.json({ success: true, _cached: cached, data });
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new GatewayError(e);
  }
}));

export default router;
