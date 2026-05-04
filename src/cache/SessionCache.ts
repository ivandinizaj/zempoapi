import fetch from "node-fetch";
import FormData from "form-data";
import type { SessionInfo } from "../types";
import { isSessionExpiredHtml } from "../utils/session";

export { isSessionExpiredHtml };

class SessionCache {
  private sessionCookie: string | null = null;
  private expiresAt: number | null = null;
  private loginPromise: Promise<string> | null = null;
  private readonly ttlMs: number;
  private readonly baseUrl: string;

  constructor() {
    this.ttlMs = parseInt(process.env.SESSION_CACHE_TTL ?? "3600") * 1000;
    this.baseUrl = process.env.ZEMPO_BASE_URL ?? "https://zempo.com.br";
  }

  isValid(): boolean {
    return this.sessionCookie !== null && Date.now() < (this.expiresAt ?? 0);
  }

  isSessionExpiredHtml(html: string): boolean {
    return isSessionExpiredHtml(html);
  }

  invalidate(): void {
    this.sessionCookie = null;
    this.expiresAt = null;
  }

  private async _doLogin(): Promise<string> {
    const codigo = process.env.ZEMPO_CODIGO;
    const senha = process.env.ZEMPO_SENHA;

    if (!codigo || !senha) {
      throw new Error("ZEMPO_CODIGO e ZEMPO_SENHA devem estar definidos no .env");
    }

    const form = new FormData();
    form.append("codigo", codigo);
    form.append("senha", senha);

    const response = await fetch(`${this.baseUrl}/?acao=logando`, {
      method: "POST",
      body: form,
      redirect: "manual",
    });

    const rawCookies = (response.headers.raw()["set-cookie"] ?? []) as string[];
    const phpSessId = rawCookies
      .map((c) => c.match(/PHPSESSID=([^;]+)/i)?.[1])
      .find(Boolean);

    if (!phpSessId) throw new Error("Login falhou: PHPSESSID não encontrado na resposta");

    this.sessionCookie = `PHPSESSID=${phpSessId}; codigo=${codigo}`;
    this.expiresAt = Date.now() + this.ttlMs;
    return this.sessionCookie;
  }

  async getCookie(): Promise<string> {
    if (this.isValid()) return this.sessionCookie!;
    if (this.loginPromise) {
      await this.loginPromise;
      return this.sessionCookie!;
    }
    this.loginPromise = this._doLogin().finally(() => {
      this.loginPromise = null;
    });
    await this.loginPromise;
    return this.sessionCookie!;
  }

  getInfo(): SessionInfo {
    return {
      active: this.isValid(),
      expiresAt: this.expiresAt ? new Date(this.expiresAt).toISOString() : null,
      expiresInSeconds: this.expiresAt
        ? Math.max(0, Math.round((this.expiresAt - Date.now()) / 1000))
        : 0,
    };
  }
}

export default new SessionCache();
