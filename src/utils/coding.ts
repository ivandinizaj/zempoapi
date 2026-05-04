export function parseCodigo(raw: string): { id: string; codigo: string } | null {
  const match = raw.match(/JU(\d+)/i);
  if (!match) return null;
  return { id: match[1], codigo: `JU${match[1]}` };
}
