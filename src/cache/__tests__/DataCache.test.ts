import { DataCache } from "../DataCache";

// O lru-cache guarda a referência de `performance` ao ser carregado, então o módulo
// precisa ser importado depois de ativar os timers falsos. Além disso, com timers
// falsos performance.now() começa em 0, que o lru-cache interpreta como "sem TTL".
function loadWithFakeClock(now = new Date("2026-01-01T00:00:00Z")): typeof DataCache {
  jest.useFakeTimers({ now });
  jest.advanceTimersByTime(1);
  let Cache!: typeof DataCache;
  jest.isolateModules(() => {
    Cache = require("../DataCache").DataCache;
  });
  return Cache;
}

afterEach(() => jest.useRealTimers());

describe("DataCache", () => {
  test("retorna null para chave ausente e o valor salvo para chave presente", () => {
    const cache = new DataCache<{ nome: string }>({ ttl: 60 });
    expect(cache.get("x")).toBeNull();

    cache.set("x", { nome: "Ivan" });
    expect(cache.get("x")).toEqual({ nome: "Ivan" });
  });

  test("entrada expira após o TTL", () => {
    const Cache = loadWithFakeClock();
    const cache = new Cache<string>({ ttl: 10 });
    cache.set("k", "v");

    jest.advanceTimersByTime(9_000);
    expect(cache.get("k")).toBe("v");

    jest.advanceTimersByTime(2_000);
    expect(cache.get("k")).toBeNull();
  });

  test("respeita maxSize descartando a entrada menos usada recentemente", () => {
    const cache = new DataCache<number>({ ttl: 60, maxSize: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // "a" passa a ser a mais recente
    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeNull();
    expect(cache.get("c")).toBe(3);
  });

  test("invalidate remove a chave e informa se ela existia", () => {
    const cache = new DataCache<number>({ ttl: 60 });
    cache.set("a", 1);

    expect(cache.invalidate("a")).toBe(true);
    expect(cache.invalidate("a")).toBe(false);
    expect(cache.get("a")).toBeNull();
  });

  test("flush limpa tudo e retorna quantas entradas foram removidas", () => {
    const cache = new DataCache<number>({ ttl: 60 });
    cache.set("a", 1);
    cache.set("b", 2);

    expect(cache.flush()).toBe(2);
    expect(cache.getStats().totalEntries).toBe(0);
  });

  describe("getStats", () => {
    test("hitRate é null antes de qualquer leitura", () => {
      expect(new DataCache<number>({ ttl: 60 }).getStats().hitRate).toBeNull();
    });

    test("contabiliza hits, misses e hitRate em porcentagem", () => {
      const cache = new DataCache<number>({ ttl: 60 });
      cache.set("a", 1);
      cache.get("a");
      cache.get("a");
      cache.get("nope");

      expect(cache.getStats()).toMatchObject({ hits: 2, misses: 1, hitRate: 67 });
    });

    test("descreve cada entrada com label e tempo restante", () => {
      const Cache = loadWithFakeClock();
      const cache = new Cache<{ nome: string }>({
        ttl: 100,
        name: "Teste",
        maxSize: 5,
        labelFn: (d) => d.nome,
      });
      cache.set("k", { nome: "Ivan" });
      jest.advanceTimersByTime(40_000);

      expect(cache.getStats()).toMatchObject({
        name: "Teste",
        maxSize: 5,
        ttlSeconds: 100,
        totalEntries: 1,
        entries: [
          { key: "k", label: "Ivan", cachedAt: "2026-01-01T00:00:00.001Z", expiresInSeconds: 60 },
        ],
      });
    });
  });
});
