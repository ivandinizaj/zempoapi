import { isNumericId } from "../../utils/coding";
import {
  filtroToSigla,
  getValidSiglas,
  isValidEstadoSigla,
  siglaToFiltro,
} from "../../utils/estadoMapper";
import {
  formatCep,
  formatCpf,
  formatTelefone,
  isValidCpf,
  normalizeNome,
  normalizeNumero,
  onlyDigits,
  toDataBr,
} from "../../utils/format";

export type EditFieldTipo =
  | "texto"
  | "numero"
  | "email"
  | "telefone"
  | "cpf"
  | "cep"
  | "data"
  | "uf"
  | "cidade"
  | "bairro";

/**
 * Comportamento de um tipo de campo do formulário de edição: validação, normalização
 * e conversão entre a API e o ZEMPO. Um tipo novo é só uma entrada em `FIELD_TYPES`.
 */
export interface FieldType {
  /** Valida a entrada da API (já sem espaços nas pontas); null = válido. */
  validate(value: string): string | null;
  /** Entrada da API → formato que o ZEMPO grava (máscaras, caixa). */
  normalize(value: string): string;
  /** Formulário do ZEMPO → API. `label` é o texto da opção selecionada, se for um select. */
  fromForm(raw: string, label: string | null): string | null;
  /** API → valor enviado no formulário. Não se aplica a `lookup`. */
  toForm(value: string): string;
  /** Valor enviado equivale ao que o ZEMPO salvou? Usado para detectar campos não aplicados. */
  equals(sent: string, saved: string): boolean;
  /** Aceita null/"" para limpar o campo. */
  clearable: boolean;
  /** Nome ou ID de uma lista do ZEMPO (cidade, bairro), resolvido consultando o ZEMPO. */
  lookup: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const texto: FieldType = {
  validate: () => null,
  normalize: (v) => v.replace(/\s+/g, " "),
  fromForm: (raw) => raw || null,
  toForm: (v) => v,
  equals: (sent, saved) => sent === saved,
  clearable: true,
  lookup: false,
};

const localidade: FieldType = {
  ...texto,
  fromForm: (_raw, label) => label,
  // enviado por ID: o formulário só devolve o nome, então não há como comparar
  equals: (sent, saved) => isNumericId(sent) || normalizeNome(sent) === normalizeNome(saved),
  clearable: false,
  lookup: true,
};

export const FIELD_TYPES: Record<EditFieldTipo, FieldType> = {
  texto,
  numero: {
    ...texto,
    validate: (v) => (normalizeNumero(v) ? null : "deve ser numérico (ex: 73.5)"),
    normalize: (v) => normalizeNumero(v) ?? v,
    fromForm: (raw) => (raw ? normalizeNumero(raw) : null),
  },
  email: {
    ...texto,
    validate: (v) => (EMAIL_REGEX.test(v) ? null : "email inválido"),
    normalize: (v) => v.toLowerCase(),
  },
  telefone: {
    ...texto,
    validate: (v) =>
      /^\d{10,11}$/.test(onlyDigits(v)) ? null : "informe DDD + número (ex: (81)99999-0000)",
    normalize: formatTelefone,
  },
  cpf: {
    ...texto,
    validate: (v) => (isValidCpf(v) ? null : "CPF inválido"),
    normalize: formatCpf,
  },
  cep: {
    ...texto,
    validate: (v) => (onlyDigits(v).length === 8 ? null : "CEP deve ter 8 dígitos (ex: 50720-123)"),
    normalize: formatCep,
  },
  data: {
    ...texto,
    validate: (v) => (toDataBr(v) ? null : "data inválida, use dd/mm/aaaa ou aaaa-mm-dd"),
    normalize: (v) => toDataBr(v) ?? v,
  },
  uf: {
    ...texto,
    validate: (v) =>
      isValidEstadoSigla(v) ? null : `use a sigla do estado (${getValidSiglas().join(", ")})`,
    normalize: (v) => v.toUpperCase(),
    fromForm: (raw) => (raw ? filtroToSigla(raw) : null),
    toForm: (v) => String(siglaToFiltro(v)),
    clearable: false,
  },
  cidade: localidade,
  bairro: localidade,
};
