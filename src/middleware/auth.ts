import type { Request, Response, NextFunction } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requiredKey = process.env.API_KEY;
  if (!requiredKey) { next(); return; }

  const providedKey = req.headers["x-api-key"] ?? req.query["api_key"];

  if (!providedKey) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Forneça a API Key via header 'X-API-Key' ou query param 'api_key'",
    });
    return;
  }

  if (providedKey !== requiredKey) {
    res.status(403).json({ error: "Forbidden", message: "API Key inválida" });
    return;
  }

  next();
}
