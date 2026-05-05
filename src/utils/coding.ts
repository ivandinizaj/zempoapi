export function parseCodigo(raw: string): { id: string; codigo: string } | null {
  const match = raw.match(/JU(\d+)/i);
  if (!match) return null;
  return { id: match[1], codigo: `JU${match[1]}` };
}

/** Aceita "2294" ou "CL002294" → retorna o ID numérico sem zeros (ex: "2294"). */
export function parseClubId(raw: string): string | null {
  if (/^\d+$/.test(raw)) return raw;
  const m = raw.match(/^CL0*(\d+)$/i);
  return m ? m[1] : null;
}
