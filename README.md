# 🥋 ZEMPO CBJ API

API não oficial para consulta de dados de atletas do sistema **ZEMPO** da **Confederação Brasileira de Judô (CBJ)**.

> **Como funciona:** A API autentica no ZEMPO com suas credenciais, busca as páginas HTML, parseia os dados e os retorna em formato JSON. Um sistema de cache duplo evita requisições desnecessárias ao ZEMPO.

---

## 📦 Instalação

```bash
# Clone o repositório
git clone <repo>
cd zempo-api

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite o .env com suas credenciais
```

---

## ⚙️ Configuração (.env)

```env
# Credenciais do ZEMPO CBJ (obrigatório)
ZEMPO_CODIGO=JU079588
ZEMPO_SENHA=sua_senha_aqui

# Porta da API (padrão: 3000)
PORT=3000

# Chave de autenticação da API (opcional - deixe vazio para dev sem auth)
API_KEY=minha_chave_secreta_aqui

# Tempo de vida do cache de sessão em segundos (padrão: 3600 = 1 hora)
SESSION_CACHE_TTL=3600

# Tempo de vida do cache de dados de atletas em segundos (padrão: 3600 = 1 hora)
USER_DATA_CACHE_TTL=3600

# Tempo de vida do cache de clubes em segundos (padrão: 172800 = 48 horas)
CLUBES_CACHE_TTL=172800

# Tempo de vida do cache de detalhes de clube em segundos (padrão: 86400 = 24 horas)
CLUB_DETAILS_CACHE_TTL=86400

# URL base do ZEMPO
ZEMPO_BASE_URL=https://zempo.com.br
```

---

## 🚀 Rodando

```bash
# Desenvolvimento (ts-node, sem build)
npm run dev

# Produção (compila TypeScript e executa)
npm run build
npm start

# Testes
npm test
```

---

## 📡 Endpoints

### `GET /`
Retorna um resumo da API com os endpoints disponíveis e o modo de autenticação ativo.

---

### `GET /api/atleta/:id`
Busca dados de um atleta pelo **ID numérico interno** do ZEMPO.

```bash
# Exemplo
curl http://localhost:3000/api/atleta/79588 \
  -H "X-API-Key: minha_chave_secreta_aqui"

# Forçar atualização ignorando cache
curl http://localhost:3000/api/atleta/79588?refresh=true \
  -H "X-API-Key: minha_chave_secreta_aqui"
```

**Resposta:**
```json
{
  "success": true,
  "_cached": false,
  "data": {
    "id": "79588",
    "codigo": "JU079588",
    "nomeCompleto": "Ivan Diniz de Araújo Júnior",
    "primeiroNome": "Ivan",
    "ultimoNome": "Júnior",
    "federacao": "FPJU - PE",
    "registroFederacao": "12/01/2015",
    "clube": "INSTITUTO IKIGAI DE JUDÔ",
    "graduacao": "Preta 1° DAN",
    "dataUltimaGraduacao": "13/12/2025",
    "genero": "masculino",
    "dataNascimento": "01/12/1993",
    "idade": 32,
    "nacionalidade": "Brasileira",
    "naturalidade": "Pernambuco",
    "peso": "80.00 kg",
    "categoria": "Meio-Médio",
    "classe": "Sênior/M1/Sênor J1/Sênior J2/Sênior Estreante- PE/Absoluto JUBS",
    "situacaoFederacao": "regular",
    "situacaoCBJ": "regular",
    "status": "Ativo",
    "selecaoBrasileira": "não",
    "email": "ivandinizaj@gmail.com",
    "celular": "(81)99690-2808",
    "telefone": "(81)99690-2808",
    "emailTecnico": "institutoikigaijudo@gmail.com",
    "cpf": "111.844.054-41",
    "foto": "https://zempo.com.br/arquivos/pessoas/..._133_100.jpg",
    "_parsedAt": "2026-05-01T15:00:00.000Z"
  }
}
```

> `_cached: true` indica que a resposta veio do cache em memória.

---

### `GET /api/atleta/codigo/:codigo`
Busca por **código público** (formato `JU` + números).

```bash
curl http://localhost:3000/api/atleta/codigo/JU079588 \
  -H "X-API-Key: minha_chave_secreta_aqui"
```

---

### `GET /api/clubes`
Lista clubes cadastrados no ZEMPO com suporte a filtro por estado, ordenação e paginação.

**Query params:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `filtro` | number | não | ID do estado no ZEMPO. Omitir para todos os estados. |
| `ordem` | string | não | `DESC` para decrescente. Omitir para crescente (padrão). |
| `pagina` | number | não | Número da página (padrão: `1`). |

**IDs de estado disponíveis:**

| ID | Estado | ID | Estado |
|----|--------|----|--------|
| 1 | Acre | 16 | Paraná |
| 2 | Alagoas | 17 | Pernambuco |
| 3 | Amapá | 18 | Piauí |
| 4 | Amazonas | 19 | Rio de Janeiro |
| 5 | Bahia | 20 | Rio Grande do Norte |
| 6 | Ceará | 21 | Rio Grande do Sul |
| 7 | Distrito Federal | 22 | Rondônia |
| 8 | Espírito Santo | 23 | Roraima |
| 9 | Goiás | 24 | Santa Catarina |
| 10 | Maranhão | 25 | São Paulo |
| 11 | Mato Grosso | 26 | Sergipe |
| 12 | Mato Grosso do Sul | 27 | Tocantins |
| 13 | Minas Gerais | 29 | Natal |
| 14 | Pará | 30 | Belém |
| 15 | Paraíba | 31 | Londrina |

```bash
# Todos os clubes, página 1
curl http://localhost:3000/api/clubes \
  -H "X-API-Key: minha_chave"

# Clubes de Pernambuco
curl "http://localhost:3000/api/clubes?filtro=17" \
  -H "X-API-Key: minha_chave"

# Clubes de PE, página 2
curl "http://localhost:3000/api/clubes?filtro=17&pagina=2" \
  -H "X-API-Key: minha_chave"

# Todos os clubes em ordem decrescente
curl "http://localhost:3000/api/clubes?ordem=DESC" \
  -H "X-API-Key: minha_chave"
```

**Resposta:**
```json
{
  "success": true,
  "_cached": false,
  "_parsedAt": "2026-05-01T15:00:00.000Z",
  "pagina": 1,
  "total": 124,
  "data": [
    {
      "foto": "https://zempo.com.br/arquivos/clubes/escudo_40_30.jpg",
      "codigo": "CL000958",
      "nome": "Academia de Judô Gaijin",
      "telefone": "(87)3854-1502",
      "email": "clemlautenbacher@gmail.com",
      "federacao": "FPJU",
      "estado": "Pernambuco"
    }
  ]
}
```

> Quando não há clubes para a consulta, `data` retorna `[]` e `total` retorna `0`.

---

### `GET /api/clubes/:id`
Retorna os **detalhes completos de um clube** pelo ID numérico ou código público.

**Formatos aceitos para `:id`:**

| Formato | Exemplo |
|---------|---------|
| ID numérico | `2294` |
| Código do clube | `CL002294` |

```bash
# Por ID numérico
curl http://localhost:3000/api/clubes/2294 \
  -H "X-API-Key: minha_chave"

# Por código público
curl http://localhost:3000/api/clubes/CL002294 \
  -H "X-API-Key: minha_chave"

# Forçar atualização ignorando cache
curl "http://localhost:3000/api/clubes/2294?refresh=true" \
  -H "X-API-Key: minha_chave"
```

**Resposta:**
```json
{
  "success": true,
  "_cached": false,
  "_parsedAt": "2026-05-04T12:00:00.000Z",
  "data": {
    "codigo": "CL002294",
    "nome": "4º Bravo Lutas - Probatório",
    "sigla": "4BL",
    "federacao": "FMTJ - MT",
    "cnpj": null,
    "email": "4bpm@pm.mt.gov.br",
    "website": null,
    "federado": true,
    "telefone": "(65)99903-0499",
    "status": "Ativo",
    "cep": "78110-302",
    "endereco": "Avenida Filinto Muller 538",
    "estado": "Mato Grosso",
    "bairro": "Centro",
    "complemento": "bairro centro",
    "cidade": "Várzea Grande",
    "facebook": null,
    "instagram": "4bravopmmt",
    "whatsapp": null,
    "twitter": null,
    "youtube": null,
    "_parsedAt": "2026-05-04T12:00:00.000Z"
  }
}
```

---

### `GET /api/status`
Status da API, sessão e caches.

```bash
curl http://localhost:3000/api/status -H "X-API-Key: minha_chave"
```

**Resposta:**
```json
{
  "success": true,
  "api": "ZEMPO CBJ API",
  "version": "1.0.0",
  "session": {
    "active": true,
    "expiresAt": "2026-05-01T16:00:00.000Z",
    "expiresInSeconds": 3542
  },
  "caches": {
    "atletas": {
      "name": "atletas",
      "totalEntries": 1,
      "ttlSeconds": 3600,
      "entries": [
        { "key": "79588", "cachedAt": "2026-05-01T15:00:00.000Z", "expiresInSeconds": 3200, "label": "Ivan Diniz de Araújo Júnior" }
      ]
    },
    "clubes": {
      "name": "clubes",
      "totalEntries": 0,
      "ttlSeconds": 172800,
      "entries": []
    }
  },
  "config": {
    "sessionTTL": 3600,
    "atletasTTL": 3600,
    "clubesTTL": 172800,
    "baseUrl": "https://zempo.com.br"
  }
}
```

---

### `POST /api/cache/invalidate/:id`
Invalida o cache de dados de **um atleta específico**.

```bash
curl -X POST http://localhost:3000/api/cache/invalidate/79588 \
  -H "X-API-Key: minha_chave"
```

---

### `POST /api/cache/flush`
Limpa **todo** o cache de dados (atletas e clubes).

```bash
curl -X POST http://localhost:3000/api/cache/flush \
  -H "X-API-Key: minha_chave"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Cache limpo — 2 atleta(s) e 1 consulta(s) de clubes removidas"
}
```

---

### `POST /api/session/invalidate`
Força um novo login no ZEMPO na próxima requisição.

```bash
curl -X POST http://localhost:3000/api/session/invalidate \
  -H "X-API-Key: minha_chave"
```

---

## 🧠 Arquitetura do Cache

```
Requisição → DataCache (HIT?) ──→ Retorna dados em memória (~0ms)
                 │ MISS
                 ↓
           SessionCache (sessão válida?) ──→ Usa PHPSESSID existente
                 │ expirada
                 ↓
           Login no ZEMPO (1 login simultâneo por vez)
                 ↓
           GET da página HTML do atleta/clubes
                 ↓
           Parser HTML (cheerio)
                 ↓
           Salva no DataCache → Retorna JSON
```

**Por que é rápido:**
- **Cache de dados:** mesma pessoa consultada 2x → 2ª chamada retorna de memória em <1ms
- **Cache de sessão:** o login costuma ser lento (~500ms) e é feito no máximo 1x por hora
- **Lock de login:** se 100 requests chegarem simultaneamente, apenas 1 login acontece; os outros 99 aguardam e reutilizam a sessão
- **Cache de clubes:** a listagem muda raramente, TTL padrão de 48 horas

---

## 🔐 Autenticação da API

Se `API_KEY` estiver definido no `.env`, todas as rotas exigem a key:

```bash
# Via header (recomendado)
-H "X-API-Key: minha_chave"

# Via query string
?api_key=minha_chave
```

Se `API_KEY` não estiver definido, a API roda sem autenticação (ideal para uso local/desenvolvimento).

CORS está habilitado para todas as origens (`*`), com suporte aos headers `X-API-Key` e `Content-Type`.

---

## 📁 Estrutura do Projeto

```
zempo-api/
├── src/
│   ├── server.ts              # Entry point Express
│   ├── cache/
│   │   ├── SessionCache.ts       # Gerencia sessão ZEMPO (singleton)
│   │   ├── DataCache.ts          # Classe base de cache genérico
│   │   ├── atletasCache.ts       # Cache de dados de atletas
│   │   ├── clubesCache.ts        # Cache de consultas de clubes
│   │   └── clubDetailsCache.ts   # Cache de detalhes de clube
│   ├── errors/
│   │   └── AppError.ts        # Erros tipados (ValidationError, GatewayError...)
│   ├── http/
│   │   └── zempoClient.ts     # Client HTTP para o ZEMPO
│   ├── middleware/
│   │   ├── asyncRoute.ts      # Wrapper para rotas assíncronas
│   │   ├── auth.ts            # Autenticação por API Key
│   │   └── errorHandler.ts    # Tratamento centralizado de erros
│   ├── parsers/
│   │   ├── athleteParser.ts       # Extrai dados do HTML de atletas
│   │   ├── clubsParser.ts         # Extrai dados do HTML de clubes
│   │   ├── clubDetailsParser.ts   # Extrai detalhes do HTML de um clube
│   │   └── parserUtils.ts         # Utilitários de parse
│   ├── routes/
│   │   ├── index.ts           # Router principal (monta sub-routers)
│   │   ├── athletes.ts        # GET /atleta/:id, GET /atleta/codigo/:codigo
│   │   ├── clubs.ts           # GET /clubes, GET /clubes/:id
│   │   └── admin.ts           # GET /status, POST /cache/*, POST /session/invalidate
│   ├── services/
│   │   ├── athleteService.ts      # Orquestra fetch + cache + parse de atletas
│   │   ├── clubsService.ts        # Orquestra fetch + cache + parse de clubes
│   │   └── clubDetailsService.ts  # Orquestra fetch + cache + parse de detalhe de clube
│   ├── types/
│   │   └── index.ts           # Interfaces TypeScript
│   ├── utils/
│   │   ├── coding.ts
│   │   ├── session.ts
│   │   ├── text.ts
│   │   └── url.ts
│   └── validators/
│       └── index.ts           # Validações de parâmetros de entrada
├── .env.example
├── package.json
└── README.md
```

---

## ⚠️ Aviso Legal

Esta é uma API **não oficial**. Ela acessa o ZEMPO em seu nome usando suas próprias credenciais. Use com responsabilidade e de acordo com os termos de uso da CBJ.
