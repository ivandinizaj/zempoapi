import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../package.json";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ZEMPO CBJ API",
      version,
      description:
        "API não oficial para consulta de dados do ZEMPO — Confederação Brasileira de Judô.\n\n" +
        "Autenticação via `X-API-Key` (header) ou `api_key` (query param) quando `API_KEY` estiver configurada no servidor.",
      contact: { email: "ivandinizaj@gmail.com" },
    },
    servers: [{ url: "/api/v1", description: "Versão atual" }],
    components: {
      securitySchemes: {
        ApiKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key" },
      },
      schemas: {
        Athlete: {
          type: "object",
          properties: {
            id: { type: "string", nullable: true, example: "79588" },
            codigo: { type: "string", nullable: true, example: "JU079588" },
            nomeCompleto: { type: "string", nullable: true, example: "João Silva" },
            primeiroNome: { type: "string", nullable: true },
            ultimoNome: { type: "string", nullable: true },
            federacao: { type: "string", nullable: true, example: "FEJE" },
            registroFederacao: { type: "string", nullable: true },
            clube: { type: "string", nullable: true },
            graduacao: { type: "string", nullable: true, example: "Faixa Preta 1º Dan" },
            dataUltimaGraduacao: { type: "string", nullable: true, example: "2022-03-15" },
            genero: { type: "string", enum: ["masculino", "feminino"], nullable: true },
            dataNascimento: { type: "string", nullable: true, example: "1995-07-20" },
            idade: { type: "integer", nullable: true, example: 29 },
            nacionalidade: { type: "string", nullable: true },
            naturalidade: { type: "string", nullable: true },
            peso: { type: "string", nullable: true, example: "73kg" },
            categoria: { type: "string", nullable: true },
            classe: { type: "string", nullable: true },
            situacaoFederacao: { type: "string", nullable: true },
            situacaoCBJ: { type: "string", nullable: true },
            status: { type: "string", nullable: true },
            selecaoBrasileira: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            celular: { type: "string", nullable: true },
            telefone: { type: "string", nullable: true },
            emailTecnico: { type: "string", nullable: true },
            cpf: { type: "string", nullable: true },
            foto: { type: "string", nullable: true, format: "uri" },
          },
        },
        Club: {
          type: "object",
          properties: {
            foto: { type: "string", nullable: true, format: "uri" },
            codigo: { type: "string", nullable: true, example: "CL002294" },
            nome: { type: "string", nullable: true, example: "Clube Esportivo" },
            telefone: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            federacao: { type: "string", nullable: true },
            estado: { type: "string", nullable: true, example: "SP" },
          },
        },
        ClubDetails: {
          type: "object",
          properties: {
            codigo: { type: "string", nullable: true, example: "CL002294" },
            nome: { type: "string", nullable: true },
            sigla: { type: "string", nullable: true },
            federacao: { type: "string", nullable: true },
            cnpj: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            website: { type: "string", nullable: true, format: "uri" },
            federado: { type: "boolean", nullable: true },
            telefone: { type: "string", nullable: true },
            status: { type: "string", nullable: true },
            cep: { type: "string", nullable: true },
            endereco: { type: "string", nullable: true },
            estado: { type: "string", nullable: true },
            bairro: { type: "string", nullable: true },
            complemento: { type: "string", nullable: true },
            cidade: { type: "string", nullable: true },
            facebook: { type: "string", nullable: true, format: "uri" },
            instagram: { type: "string", nullable: true, format: "uri" },
            whatsapp: { type: "string", nullable: true },
            twitter: { type: "string", nullable: true, format: "uri" },
            youtube: { type: "string", nullable: true, format: "uri" },
          },
        },
        CacheEntryStats: {
          type: "object",
          properties: {
            key: { type: "string" },
            cachedAt: { type: "string", format: "date-time" },
            expiresInSeconds: { type: "integer" },
            label: { type: "string", nullable: true },
          },
        },
        CacheStats: {
          type: "object",
          properties: {
            name: { type: "string" },
            totalEntries: { type: "integer" },
            maxSize: { type: "integer" },
            ttlSeconds: { type: "integer" },
            hits: { type: "integer" },
            misses: { type: "integer" },
            hitRate: { type: "number", nullable: true },
            entries: { type: "array", items: { $ref: "#/components/schemas/CacheEntryStats" } },
          },
        },
        SessionInfo: {
          type: "object",
          properties: {
            active: { type: "boolean" },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            expiresInSeconds: { type: "integer" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Bad Request" },
            message: { type: "string", example: "ID inválido. Use um número inteiro positivo." },
          },
        },
      },
      responses: {
        ValidationError: {
          description: "Parâmetro inválido",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        GatewayError: {
          description: "Falha ao comunicar com o ZEMPO",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { error: "Bad Gateway", message: "Falha ao comunicar com o ZEMPO" },
            },
          },
        },
        Unauthorized: {
          description: "API Key inválida ou ausente",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { error: "Unauthorized", message: "API Key inválida" },
            },
          },
        },
      },
    },
    security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }],
  },
  apis: [`${__dirname}/../routes/*.ts`, `${__dirname}/../routes/*.js`],
};

export const swaggerSpec = swaggerJsdoc(options);
