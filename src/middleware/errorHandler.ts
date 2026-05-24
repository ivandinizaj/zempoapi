import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import logger from "../utils/logger";
import { recordError } from "./keyMetrics";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.title, message: err.message });
    return;
  }

  if (req.keyLabel) recordError(req.keyLabel);

  logger.error(
    {
      reqId: req.id,
      method: req.method,
      path: req.path,
      keyLabel: req.keyLabel,
      err,
    },
    "Unhandled server error",
  );

  res.status(500).json({ error: "Internal Server Error", message: err.message });
}
