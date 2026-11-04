import { randomBytes } from "crypto";
import type { EditFormEntry } from "../types";

/**
 * Converte para ISO-8859-1 como o navegador faz em páginas latin1:
 * caracteres fora da faixa viram referência numérica HTML (&#NNNN;).
 */
export function encodeLatin1(value: string): Buffer {
  const safe = value.replace(/[^\u0000-ÿ]/gu, (ch) => `&#${ch.codePointAt(0)};`);
  return Buffer.from(safe, "latin1");
}

/**
 * Monta um corpo multipart/form-data idêntico ao do navegador (inclusive partes
 * de arquivo vazias com `filename=""`), codificado em latin1 — o charset do ZEMPO.
 */
export function buildMultipartLatin1(entries: EditFormEntry[]): {
  body: Buffer;
  contentType: string;
} {
  const boundary = `----ZempoApiBoundary${randomBytes(12).toString("hex")}`;
  const parts: Buffer[] = [];

  for (const { name, value, isFile } of entries) {
    const header = isFile
      ? `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename=""\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`
      : `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n`;
    parts.push(
      encodeLatin1(header),
      isFile ? Buffer.alloc(0) : encodeLatin1(value),
      Buffer.from("\r\n"),
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}
