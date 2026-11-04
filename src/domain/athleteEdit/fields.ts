import type { AthleteUpdateInput } from "../../types";
import { FIELD_TYPES, type EditFieldTipo, type FieldType } from "./fieldTypes";

/**
 * Campos do formulário "pessoas_editar" que a API permite alterar.
 * Chave = nome exposto na API; `campo` = `name` do input no ZEMPO; `tipo` define
 * validação e conversão (ver `FIELD_TYPES`).
 */
interface EditFieldDef {
  /** null = campo virtual, sem input próprio no ZEMPO. */
  campo: string | null;
  tipo: EditFieldTipo;
}

export const ATHLETE_EDIT_FIELDS = {
  peso: { campo: "peso", tipo: "numero" },
  nacionalidade: { campo: "nacionalidade", tipo: "texto" },
  email: { campo: "email", tipo: "email" },
  celular: { campo: "celular", tipo: "telefone" },
  telefone: { campo: "telefone", tipo: "telefone" },
  responsavel: { campo: "responsavel", tipo: "texto" },
  responsavelParentesco: { campo: "responsavel_parentesco", tipo: "texto" },
  emailTecnico: { campo: "email_tecnico", tipo: "email" },
  cpf: { campo: "cpf", tipo: "cpf" },
  rg: { campo: "rg", tipo: "texto" },
  rgOrgaoExpedidor: { campo: "rg_orgao", tipo: "texto" },
  rgEstadoEmissor: { campo: "rg_estado", tipo: "uf" },
  rgDataExpedicao: { campo: "rg_data", tipo: "data" },
  passaporte: { campo: "passaporte", tipo: "texto" },
  passaporteValidade: { campo: "passaporte_data", tipo: "data" },
  passaporteOrgaoEmissor: { campo: "passaporte_orgao", tipo: "texto" },
  passaporteDataExpedicao: { campo: "passaporte_expedicao", tipo: "data" },
  cep: { campo: "cep", tipo: "cep" },
  endereco: { campo: "endereco", tipo: "texto" },
  numero: { campo: null, tipo: "texto" },
  complemento: { campo: "complemento", tipo: "texto" },
  estado: { campo: "estado", tipo: "uf" },
  cidade: { campo: "cidade", tipo: "cidade" },
  bairro: { campo: "bairro", tipo: "bairro" },
} as const satisfies Record<string, EditFieldDef>;

export type AthleteEditKey = keyof typeof ATHLETE_EDIT_FIELDS;

export const ATHLETE_EDIT_KEYS = Object.keys(ATHLETE_EDIT_FIELDS) as AthleteEditKey[];

/** `hasOwn` e não `in`: `in` aceita chaves do prototype ("toString", "constructor"...). */
export function isAthleteEditKey(key: string): key is AthleteEditKey {
  return Object.hasOwn(ATHLETE_EDIT_FIELDS, key);
}

export function fieldType(key: AthleteEditKey): FieldType {
  return FIELD_TYPES[ATHLETE_EDIT_FIELDS[key].tipo];
}

/**
 * O ZEMPO guarda logradouro e número num único input "endereco" ("Rua X, 45"):
 * esses dois campos são lidos com `splitEndereco` e gravados com `joinEndereco`.
 */
export function isEnderecoPart(key: AthleteEditKey): boolean {
  return key === "endereco" || key === "numero";
}

/** Normaliza o body já validado para o formato gravado pelo ZEMPO (null → "" para limpar). */
export function normalizeAthleteUpdate(
  body: Record<string, string | number | null>,
): AthleteUpdateInput {
  const input: AthleteUpdateInput = {};
  for (const [key, raw] of Object.entries(body)) {
    if (!isAthleteEditKey(key)) continue;
    const value = raw === null || raw === undefined ? "" : String(raw).trim();
    input[key] = value === "" ? "" : fieldType(key).normalize(value);
  }
  return input;
}
