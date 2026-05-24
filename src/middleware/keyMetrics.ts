/**
 * Contadores de uso por API key mantidos em memória.
 *
 * Cada requisição autenticada incrementa um contador associado ao `label` da key
 * utilizada. Isso permite saber, sem depender de logs externos, quais keys estão
 * ativas, com que frequência cada uma consome a API e quais estão gerando erros —
 * informação útil para auditar abusos, revogar keys problemáticas ou dimensionar limites.
 *
 * Os contadores vivem no processo Node.js e são zerados a cada reinício do servidor.
 * São expostos como snapshot somente-leitura em `GET /api/v1/status` (painel admin).
 *
 * O Map usa o `label` legível da key (definido em `API_KEYS`), nunca o valor secreto,
 * para que logs e respostas administrativas jamais exponham credenciais.
 */

/** Contadores acumulados para uma única API key. */
export interface KeyStat {
  /** Total de requisições autenticadas com sucesso desde o início do processo. */
  requests: number;
  /** Total de erros 5xx atribuídos a esta key desde o início do processo. */
  errors: number;
  /** Timestamp ISO-8601 da última requisição autenticada, ou `null` se ainda não houve nenhuma. */
  lastSeenAt: string | null;
}

const stats = new Map<string, KeyStat>();

/**
 * Incrementa o contador de requisições do `label` e atualiza `lastSeenAt`.
 *
 * Chamada pelo `authMiddleware` logo após a autenticação ser aprovada, antes de
 * qualquer handler de rota executar. Registrar neste ponto — e não ao final da
 * requisição — garante que toda requisição autenticada seja contabilizada,
 * independente de a rota produzir um erro de aplicação depois.
 *
 * @param label - Nome legível da API key conforme definido em `API_KEYS`.
 */
export function recordRequest(label: string): void {
  const s = stats.get(label) ?? { requests: 0, errors: 0, lastSeenAt: null };
  s.requests++;
  s.lastSeenAt = new Date().toISOString();
  stats.set(label, s);
}

/**
 * Incrementa o contador de erros do `label`.
 *
 * Chamada pelo `errorHandler` quando uma requisição termina em erro 5xx, atribuindo
 * a falha à key que originou a chamada. Correlacionar erros com keys específicas
 * permite identificar integrações com comportamento anômalo (ex.: payloads malformados
 * recorrentes) sem precisar cruzar logs manualmente.
 *
 * Só incrementa se o `label` já possuir uma entrada no Map — ou seja, a key foi
 * autenticada ao menos uma vez. Labels desconhecidos são ignorados silenciosamente.
 *
 * @param label - Nome legível da API key conforme definido em `API_KEYS`.
 */
export function recordError(label: string): void {
  const s = stats.get(label);
  if (s) s.errors++;
}

/**
 * Retorna um snapshot dos contadores como objeto simples, pronto para serialização JSON.
 *
 * `Object.fromEntries` produz uma cópia rasa do Map, de modo que mutações no objeto
 * retornado não afetam os contadores internos.
 *
 * @returns Objeto mapeando cada label de API key ao seu {@link KeyStat}.
 */
export function getKeyStats(): Record<string, KeyStat> {
  return Object.fromEntries(stats);
}
