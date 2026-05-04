# CLAUDE.md — apizempo / ZEMPO CBJ API

API não oficial em Node.js/TypeScript que faz scraping do site ZEMPO (Confederação Brasileira de Judô) e expõe dados via REST.

---

## Stack

- **Runtime:** Node.js + TypeScript 5.x
- **Framework HTTP:** Express 4.x
- **Scraping:** cheerio (HTML parsing), node-fetch v2 (HTTP)
- **Testes:** Jest + ts-jest (`npm test`)
- **Dev:** ts-node (`npm run dev`), build prod: `tsc` → `dist/`

---

## Estrutura de pastas

```
src/
  server.ts          # bootstrap Express, middlewares globais, CORS, 404, errorHandler
  routes/            # handlers HTTP — só validação + chamada de service
  services/          # lógica de negócio: cache-check → fetch → parse → cache-set
  parsers/           # parse HTML com cheerio → tipos estruturados
  cache/             # DataCache<T> genérico + instâncias (atletasCache, clubesCache, SessionCache)
  errors/            # AppError, ValidationError, GatewayError
  middleware/        # asyncRoute, auth, errorHandler
  validators/        # funções puras que retornam string|null (null = válido)
  utils/             # helpers reutilizáveis (text, url, estadoMapper, session, coding)
  types/index.ts     # todas as interfaces/tipos do domínio
```

---

## Padrões obrigatórios

### Rotas (`src/routes/`)

- Sempre envolvidas em `asyncRoute(async (req, res) => {...})` — nunca `try/catch` manual na rota.
- Responsabilidade única: validar entrada → chamar service → serializar resposta.
- Erros de validação: `throw new ValidationError(mensagem)`.
- Erros de gateway (falha ao comunicar com ZEMPO): `throw new GatewayError(e)`.
- Erros de domínio já tipados (`AppError`): re-lançar com `if (e instanceof AppError) throw e`.

```ts
// padrão de rota
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const err = validateXxx(req.query.x as string);
    if (err) throw new ValidationError(err);

    const { data, cached } = await getXxx(options);
    res.json({ success: true, _cached: cached, data });
  }),
);
```

### Services (`src/services/`)

- Assinatura: `async function getXxx(opts): Promise<ServiceResult<T>>`.
- Fluxo fixo: montar `cacheKey` → checar cache → fetch HTML → parse → salvar cache → retornar `{ data, cached }`.
- Nunca lançar erros HTTP aqui — apenas erros de infraestrutura (`Error` normal).

```ts
export async function getXxx(
  opts: XxxOptions = {},
): Promise<ServiceResult<XxxType>> {
  const cacheKey = `...`;
  if (!opts.forceRefresh) {
    const cached = xxxCache.get(cacheKey);
    if (cached) return { data: cached, cached: true };
  }
  const html = await fetchPage(`${BASE_URL}/...`);
  const parsed = parseXxx(html, BASE_URL);
  xxxCache.set(cacheKey, parsed);
  return { data: parsed, cached: false, _parsedAt };
}
```

### Parsers (`src/parsers/`)

- Funções puras: recebem `html: string` (e opcionalmente `baseUrl`), retornam tipo estruturado.
- Usar `cheerio.load(html)` internamente.
- Helpers de texto: `normalizeText()` de `utils/text.ts`, `resolveAbsoluteUrl()` de `utils/url.ts`.
- Campos ausentes no HTML → `null` (nunca string vazia, nunca undefined).
- Sempre incluir `_parsedAt: new Date().toISOString()` no objeto raiz retornado.

### Validators (`src/validators/`)

- Funções puras: `(input) => string | null` — `null` significa válido.
- Sem side-effects, sem imports de infra.
- Mensagens de erro em pt-BR, com exemplo quando útil.

### Cache (`src/cache/`)

- Usar a classe genérica `DataCache<T>` para novos caches de dados.
- Instanciar como singleton no módulo (ex: `export default new DataCache<Foo>({...})`).
- TTL em segundos no construtor; `maxSize` para limitar memória.
- `labelFn` opcional para identificar entradas nos stats de admin.

### Erros (`src/errors/AppError.ts`)

- `AppError(status, title, message)` — base.
- `ValidationError(message)` → 400.
- `GatewayError(cause)` → 502.
- Para novos tipos de erro, estender `AppError` e definir status/title fixos.

### Tipos (`src/types/index.ts`)

- Todas as interfaces de domínio ficam aqui.
- Campos opcionais do domínio são `T | null`, não `T | undefined`.
- `ServiceResult<T>` = `{ data: T; cached: boolean }` — retorno padrão de todo service.

---

## Adicionando um novo endpoint

1. **Tipo** → `src/types/index.ts`: definir interface de resultado e de opções.
2. **Parser** → `src/parsers/xxxParser.ts`: função pura HTML → tipo. Testar em `__tests__/`.
3. **Cache** → `src/cache/xxxCache.ts`: `new DataCache<Xxx>({ ttl, name, labelFn })`.
4. **Service** → `src/services/xxxService.ts`: fluxo cache → fetch → parse → cache.
5. **Validator** → adicionar em `src/validators/index.ts` se houver parâmetros de entrada.
6. **Rota** → `src/routes/xxx.ts`: validar → chamar service → responder.
7. **Registrar** → `src/routes/index.ts`: `router.use("/xxx", authMiddleware, xxxRouter)`.

---

## Resposta JSON padrão

```json
{
  "success": true,
  "_cached": false,
  "_parsedAt": "2025-01-01T00:00:00.000Z",
  "data": { ... }
}
```

Erros seguem:

```json
{ "error": "Bad Request", "message": "mensagem legível" }
```

---

## Autenticação

- Opcional: se `API_KEY` estiver definida no `.env`, o `authMiddleware` exige `X-API-Key` (header) ou `api_key` (query param) em todas as rotas `/api`.
- Dev sem `API_KEY` = sem autenticação.

---

## Sessão ZEMPO

- `SessionCache` gerencia o cookie de sessão (login automático).
- `zempoClient.fetchPage(url)` detecta sessão expirada e renova automaticamente (1 retry).
- Nunca usar `fetch` direto para o ZEMPO — sempre passar por `fetchPage`.

---

## Testes

- Ficam em `src/parsers/__tests__/` e `src/utils/__tests__/`.
- Testar parsers com HTML real (fixtures) ou truncado.
- Testar validators com entradas válidas/inválidas.
- Rodar: `npm test`.
