import fetch from "node-fetch";
import pLimit from "p-limit";
import sessionCache from "../cache/SessionCache";
import { isSessionExpiredHtml } from "../utils/session";

export const BASE_URL = process.env.ZEMPO_BASE_URL ?? "https://zempo.com.br";

const CONCURRENCY = Number(process.env.ZEMPO_CONCURRENCY ?? 5);
const TIMEOUT_MS = Number(process.env.ZEMPO_REQUEST_TIMEOUT_MS ?? 15_000);
const DELAY_MS = Number(process.env.ZEMPO_REQUEST_DELAY_MS ?? 300);
const MAX_RETRIES = 2;

const limit = pLimit(CONCURRENCY);

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err instanceof RetryableError) return true;
  // AbortError = nosso timeout — não faz sentido retentar
  if (err.name === "AbortError") return false;
  const code = (err as NodeJS.ErrnoException).code ?? "";
  return ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND"].includes(code);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function get(url: string): Promise<string> {
  const cookie = await sessionCache.getCookie();
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Cookie: cookie, ...BROWSER_HEADERS },
      signal: controller.signal as any,
    });

    if (response.status >= 500) {
      throw new RetryableError(`ZEMPO retornou ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timerId);
  }
}

async function fetchWithRetry(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = 200 * 2 ** (attempt - 1); // 200ms, 400ms
      console.warn(`[ZempoClient] Tentativa ${attempt + 1}/${MAX_RETRIES + 1} em ${backoff}ms — ${(lastErr as Error).message}`);
      await sleep(backoff);
    }
    try {
      return await get(url);
    } catch (err) {
      if (!isRetryable(err)) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function fetchPage(url: string): Promise<string> {
  return limit(async () => {
    try {
      let html = await fetchWithRetry(url);

      if (isSessionExpiredHtml(html)) {
        console.log(`[ZempoClient] Sessão expirada. Renovando...`);
        sessionCache.invalidate();
        html = await get(url);

        if (isSessionExpiredHtml(html)) {
          throw new Error("Não foi possível autenticar no ZEMPO após renovar sessão");
        }
      }

      return html;
    } finally {
      // mantém o slot ocupado por DELAY_MS para não sobrecarregar o ZEMPO
      await sleep(DELAY_MS);
    }
  });
}
