import type { Request, Response, NextFunction } from "express";

function loadValidKeys(): Map<string, string> {
  const keys = new Map<string, string>();

  const raw = process.env.API_KEYS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [key, label] of Object.entries(parsed)) {
        if (typeof label === "string") keys.set(key, label);
      }
    } catch {
      console.error("[auth] API_KEYS inválido — JSON malformado. Ignorando.");
    }
  }

  // retrocompatibilidade com API_KEY simples
  const single = process.env.API_KEY;
  if (single) keys.set(single, "default");

  return keys;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const validKeys = loadValidKeys();
  if (validKeys.size === 0) { next(); return; }

  const providedKey = req.headers["x-api-key"];

  if (!providedKey) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Forneça a API Key via header 'X-API-Key'",
    });
    return;
  }

  if (!validKeys.has(providedKey as string)) {
    res.status(403).json({ error: "Forbidden", message: "API Key inválida" });
    return;
  }

  next();
}
