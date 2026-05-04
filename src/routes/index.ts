import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import athleteRoutes from "./athletes";
import clubsRoutes from "./clubs";
import adminRoutes from "./admin";

const router = Router();

router.use(authMiddleware);
router.use("/atleta", athleteRoutes);
router.use("/clubes", clubsRoutes);
router.use("/", adminRoutes);

export default router;
