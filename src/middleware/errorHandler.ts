import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.title, message: err.message });
    return;
  }
  console.error("[Server Error]", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
}
