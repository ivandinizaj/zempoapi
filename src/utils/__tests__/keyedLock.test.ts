import { createKeyedLock } from "../keyedLock";

const tick = () => new Promise((r) => setTimeout(r, 5));

describe("createKeyedLock", () => {
  it("serializa operações da mesma chave", async () => {
    const withLock = createKeyedLock();
    const log: string[] = [];
    const op = (name: string) => async () => {
      log.push(`${name}:start`);
      await tick();
      log.push(`${name}:end`);
    };
    await Promise.all([withLock("1", op("a")), withLock("1", op("b"))]);
    expect(log).toEqual(["a:start", "a:end", "b:start", "b:end"]);
  });

  it("roda chaves diferentes em paralelo", async () => {
    const withLock = createKeyedLock();
    const log: string[] = [];
    const op = (name: string) => async () => {
      log.push(`${name}:start`);
      await tick();
      log.push(`${name}:end`);
    };
    await Promise.all([withLock("1", op("a")), withLock("2", op("b"))]);
    expect(log.slice(0, 2)).toEqual(["a:start", "b:start"]);
  });

  it("não trava a fila quando uma operação falha", async () => {
    const withLock = createKeyedLock();
    const falha = withLock("1", () => Promise.reject(new Error("x")));
    const ok = withLock("1", () => Promise.resolve(42));
    await expect(falha).rejects.toThrow("x");
    await expect(ok).resolves.toBe(42);
  });
});
