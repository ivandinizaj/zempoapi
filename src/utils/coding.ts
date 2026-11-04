/** ID do ZEMPO: só dígitos ("5406"). */
export const isNumericId = (raw: string): boolean => /^\d+$/.test(raw);

export function parseCodigo(raw: string): { id: string; codigo: string } | null {
  const match = raw.match(/JU(\d+)/i);
  if (!match) return null;
  return { id: match[1], codigo: `JU${match[1]}` };
}

/** Aceita "2294" ou "CL002294" → retorna o ID numérico sem zeros (ex: "2294"). */
export function parseClubId(raw: string): string | null {
  if (isNumericId(raw)) return raw;
  const m = raw.match(/^CL0*(\d+)$/i);
  return m ? m[1] : null;
}

/** Aceita "79588" ou "JU079588" → retorna o ID numérico sem zeros à esquerda (ex: "79588"). */
export function parseAthleteId(raw: string): string | null {
  const m = raw.match(/^(?:JU)?(\d+)$/i);
  if (!m) return null;
  const id = m[1].replace(/^0+/, "");
  return id || null;
}
