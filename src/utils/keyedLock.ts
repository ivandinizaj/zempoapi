/**
 * Serializa operações por chave: chamadas com a mesma chave rodam uma após a outra,
 * chaves diferentes rodam em paralelo. Falha de uma operação não bloqueia a próxima.
 */
export function createKeyedLock() {
  const tails = new Map<string, Promise<void>>();

  return async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const run = (tails.get(key) ?? Promise.resolve()).then(fn);
    const tail = run.then(
      () => undefined,
      () => undefined,
    );
    tails.set(key, tail);
    try {
      return await run;
    } finally {
      if (tails.get(key) === tail) tails.delete(key);
    }
  };
}
