export function resolveAbsoluteUrl(src: string | undefined, baseUrl: string): string | null {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${baseUrl}/${src.replace(/^\//, "")}`;
}
