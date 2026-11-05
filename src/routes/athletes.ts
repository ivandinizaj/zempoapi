import { Router } from "express";
import { getAthleteById, getAthleteByCode } from "../services/athleteService";
import { getAthleteEditData, updateAthleteProfile } from "../services/athleteEditService";
import {
  validateAthleteId,
  validateAthleteIdOrCodigo,
  validateAthleteUpdateBody,
  validateAtletaCodigo,
} from "../validators";
import { ValidationError } from "../errors/AppError";
import { asyncRoute } from "../middleware/asyncRoute";
import { parseAthleteId } from "../utils/coding";
import { normalizeAthleteUpdate } from "../domain/athleteEdit/fields";

const router = Router();

/**
 * @openapi
 * /atleta/{id}:
 *   get:
 *     tags: [Atletas]
 *     summary: Busca atleta por ID numérico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID numérico do atleta (ex: 79588)"
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Força atualização ignorando o cache
 *     responses:
 *       '200':
 *         description: Atleta encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 _cached:
 *                   type: boolean
 *                 _parsedAt:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Athlete'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    const err = validateAthleteId(id);
    if (err) throw new ValidationError(err);

    const { data, cached, _parsedAt } = await getAthleteById(id, req.query["refresh"] === "true");
    res.json({ success: true, _cached: cached, _parsedAt, data });
  }),
);

/**
 * @openapi
 * /atleta/codigo/{codigo}:
 *   get:
 *     tags: [Atletas]
 *     summary: Busca atleta por código público
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: "Código público do atleta (ex: JU079588)"
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Força atualização ignorando o cache
 *     responses:
 *       '200':
 *         description: Atleta encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 _cached:
 *                   type: boolean
 *                 _parsedAt:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Athlete'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
router.get(
  "/codigo/:codigo",
  asyncRoute(async (req, res) => {
    const { codigo } = req.params;
    const err = validateAtletaCodigo(codigo);
    if (err) throw new ValidationError(err);

    const { data, cached, _parsedAt } = await getAthleteByCode(
      codigo,
      req.query["refresh"] === "true",
    );
    res.json({ success: true, _cached: cached, _parsedAt, data });
  }),
);

function parseIdParam(rawId: string): string {
  const err = validateAthleteIdOrCodigo(rawId);
  if (err) throw new ValidationError(err);
  // validateAthleteIdOrCodigo é definido via parseAthleteId: aqui nunca é null
  return parseAthleteId(rawId)!;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AthleteEditData:
 *       type: object
 *       description: |
 *         Dados cadastrais editáveis. No PATCH envie apenas os campos a alterar;
 *         `null` limpa um campo opcional. Máscaras são aplicadas automaticamente
 *         (CPF, CEP, telefone) e datas aceitam `dd/mm/aaaa` ou `aaaa-mm-dd`.
 *       properties:
 *         peso: { type: string, nullable: true, example: "81.5", description: "Peso em kg (ponto ou vírgula). A categoria é recalculada pelo ZEMPO." }
 *         nacionalidade: { type: string, nullable: true, example: "Brasileira" }
 *         email: { type: string, nullable: true, format: email, example: "atleta@example.com" }
 *         celular: { type: string, nullable: true, example: "(81)99999-0000" }
 *         telefone: { type: string, nullable: true, example: "(81)3333-4444", description: "Telefone residencial" }
 *         responsavel: { type: string, nullable: true, example: "Maria Souza", description: "Nome do responsável" }
 *         responsavelParentesco: { type: string, nullable: true, example: "mãe" }
 *         emailTecnico: { type: string, nullable: true, format: email }
 *         cpf: { type: string, nullable: true, example: "529.982.247-25", description: "Com ou sem máscara; dígitos verificadores são validados" }
 *         rg: { type: string, nullable: true, example: "1234567" }
 *         rgOrgaoExpedidor: { type: string, nullable: true, example: "SDS" }
 *         rgEstadoEmissor: { type: string, nullable: true, example: "PE", description: "Sigla da UF" }
 *         rgDataExpedicao: { type: string, nullable: true, example: "18/06/2009" }
 *         passaporte: { type: string, nullable: true, example: "FX123456", description: "Nº do passaporte" }
 *         passaporteValidade: { type: string, nullable: true, example: "10/05/2030" }
 *         passaporteOrgaoEmissor: { type: string, nullable: true, example: "DPF" }
 *         passaporteDataExpedicao: { type: string, nullable: true, example: "10/05/2020" }
 *         cep: { type: string, nullable: true, example: "50720-123" }
 *         endereco: { type: string, nullable: true, example: "Rua Exemplo", description: "Logradouro, sem o número" }
 *         numero: { type: string, nullable: true, example: "45", description: "Concatenado ao endereço no ZEMPO (\"Rua Exemplo, 45\")" }
 *         complemento: { type: string, nullable: true, example: "Apto 102" }
 *         estado: { type: string, nullable: true, example: "PE", description: "Sigla da UF. Ao alterar, envie também cidade e bairro." }
 *         cidade: { type: string, nullable: true, example: "Recife", description: "Nome (ver GET /localidades/estados/{uf}/cidades) ou ID ZEMPO. Ao alterar, envie também o bairro." }
 *         bairro: { type: string, nullable: true, example: "Madalena", description: "Nome (ver GET /localidades/cidades/{id}/bairros) ou ID ZEMPO" }
 */

/**
 * @openapi
 * /atleta/{id}/editar:
 *   get:
 *     tags: [Edição de atletas]
 *     summary: Consultar dados editáveis do atleta
 *     description: Retorna os valores atuais no mesmo formato aceito por `PATCH /atleta/{id}`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID numérico (ex: 79588) ou código do atleta (ex: JU079588)"
 *     responses:
 *       '200':
 *         description: Dados editáveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 _cached: { type: boolean, example: false }
 *                 _parsedAt: { type: string, format: date-time }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "79588" }
 *                     nomeCompleto: { type: string, nullable: true }
 *                     dados: { $ref: '#/components/schemas/AthleteEditData' }
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Sem permissão para editar este atleta
 *       '404':
 *         description: Formulário de edição não encontrado
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
router.get(
  "/:id/editar",
  asyncRoute(async (req, res) => {
    const id = parseIdParam(req.params.id);
    const { data, cached, _parsedAt } = await getAthleteEditData(id);
    res.json({ success: true, _cached: cached, _parsedAt, data });
  }),
);

/**
 * @openapi
 * /atleta/{id}:
 *   patch:
 *     tags: [Edição de atletas]
 *     summary: Atualizar cadastro do atleta no ZEMPO
 *     description: |
 *       Envie apenas os campos a alterar; os demais são reenviados ao ZEMPO com o valor atual.
 *       Sucesso = o ZEMPO exibiu "Atleta atualizado com sucesso!". `naoAplicados` lista campos
 *       enviados que não aparecem com o novo valor após salvar.
 *
 *       **Campos editáveis**
 *
 *       | Grupo | Campo | Formato |
 *       |---|---|---|
 *       | Básicos | `peso` | número em kg (`81.5` ou `"81,5"`) — recalcula a categoria |
 *       | | `nacionalidade` | texto |
 *       | | `email` | email |
 *       | | `celular` | DDD + número, com ou sem máscara |
 *       | | `telefone` | DDD + número (residencial) |
 *       | | `responsavel` | nome do responsável |
 *       | | `responsavelParentesco` | texto (ex: mãe) |
 *       | | `emailTecnico` | email |
 *       | Documentos | `cpf` | com ou sem máscara (dígitos validados) |
 *       | | `rg` | texto |
 *       | | `rgOrgaoExpedidor` | texto (ex: SDS) |
 *       | | `rgEstadoEmissor` | sigla da UF (ex: PE) |
 *       | | `rgDataExpedicao` | `dd/mm/aaaa` ou `aaaa-mm-dd` |
 *       | | `passaporte` | nº do passaporte |
 *       | | `passaporteValidade` | data |
 *       | | `passaporteOrgaoEmissor` | texto |
 *       | | `passaporteDataExpedicao` | data |
 *       | Endereço | `cep` | 8 dígitos, com ou sem máscara |
 *       | | `endereco` | logradouro, sem o número |
 *       | | `numero` | gravado junto ao endereço ("Rua X, 45") |
 *       | | `complemento` | texto |
 *       | | `estado` | sigla da UF — exige `cidade` e `bairro` |
 *       | | `cidade` | nome ou ID ([lista](#/Localidades)) — exige `bairro` |
 *       | | `bairro` | nome ou ID ([lista](#/Localidades)) |
 *
 *       `null` limpa um campo opcional; campos obrigatórios não podem ser limpos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID numérico (ex: 79588) ou código do atleta (ex: JU079588)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AthleteEditData'
 *           examples:
 *             todos:
 *               summary: Todos os campos editáveis (remova os que não for alterar)
 *               value:
 *                 peso: 81.5
 *                 nacionalidade: "Brasileira"
 *                 email: "atleta@example.com"
 *                 celular: "(81)99999-0000"
 *                 telefone: "(81)3333-4444"
 *                 responsavel: "Maria Souza"
 *                 responsavelParentesco: "mãe"
 *                 emailTecnico: "tecnico@example.com"
 *                 cpf: "529.982.247-25"
 *                 rg: "1234567"
 *                 rgOrgaoExpedidor: "SDS"
 *                 rgEstadoEmissor: "PE"
 *                 rgDataExpedicao: "18/06/2009"
 *                 passaporte: "FX123456"
 *                 passaporteValidade: "10/05/2030"
 *                 passaporteOrgaoEmissor: "DPF"
 *                 passaporteDataExpedicao: "10/05/2020"
 *                 cep: "50720-123"
 *                 endereco: "Rua Exemplo"
 *                 numero: "45"
 *                 complemento: "Apto 102"
 *                 estado: "PE"
 *                 cidade: "Recife"
 *                 bairro: "Madalena"
 *             contato:
 *               summary: Contato e peso
 *               value: { email: "atleta@example.com", celular: "81999990000", peso: 81.5 }
 *             endereco:
 *               summary: Mudança de endereço
 *               value: { cep: "50720123", endereco: "Rua Exemplo", numero: "45", complemento: "Apto 102", estado: "PE", cidade: "Recife", bairro: "Madalena" }
 *             documentos:
 *               summary: Documentos
 *               value: { cpf: "52998224725", rg: "1234567", rgOrgaoExpedidor: "SDS", rgEstadoEmissor: "PE", rgDataExpedicao: "2009-06-18" }
 *     responses:
 *       '200':
 *         description: Atleta atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 _cached: { type: boolean, example: false }
 *                 _parsedAt: { type: string, format: date-time }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sucesso: { type: boolean, example: true }
 *                     mensagem: { type: string, example: "Atleta atualizado com sucesso!" }
 *                     naoAplicados: { type: array, items: { type: string }, example: [] }
 *                     dados: { $ref: '#/components/schemas/AthleteEditData' }
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Sem permissão para editar este atleta
 *       '404':
 *         description: Formulário de edição não encontrado
 *       '422':
 *         description: ZEMPO não confirmou a atualização
 *       '502':
 *         $ref: '#/components/responses/GatewayError'
 */
router.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const id = parseIdParam(req.params.id);
    const bodyErr = validateAthleteUpdateBody(req.body);
    if (bodyErr) throw new ValidationError(bodyErr);
    const input = normalizeAthleteUpdate(req.body as Record<string, string | number | null>);

    const { data, cached, _parsedAt } = await updateAthleteProfile(id, input);
    res.json({ success: true, _cached: cached, _parsedAt, data });
  }),
);

export default router;
