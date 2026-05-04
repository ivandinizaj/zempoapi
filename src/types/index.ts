export interface Athlete {
  id: string | null;
  codigo: string | null;
  nomeCompleto: string | null;
  primeiroNome: string | null;
  ultimoNome: string | null;
  federacao: string | null;
  registroFederacao: string | null;
  clube: string | null;
  graduacao: string | null;
  dataUltimaGraduacao: string | null;
  genero: "masculino" | "feminino" | null;
  dataNascimento: string | null;
  idade: number | null;
  nacionalidade: string | null;
  naturalidade: string | null;
  peso: string | null;
  categoria: string | null;
  classe: string | null;
  situacaoFederacao: string | null;
  situacaoCBJ: string | null;
  status: string | null;
  selecaoBrasileira: string | null;
  email: string | null;
  celular: string | null;
  telefone: string | null;
  emailTecnico: string | null;
  cpf: string | null;
  foto: string | null;
  _parsedAt: string;
}

export interface Club {
  foto: string | null;
  codigo: string | null;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  federacao: string | null;
  estado: string | null;
}

export interface ClubsPage {
  clubes: Club[];
  total: number;
  pagina: number;
  _parsedAt: string;
}

export interface ServiceResult<T> {
  data: T;
  cached: boolean;
}

export interface CacheEntryStats {
  key: string;
  cachedAt: string;
  expiresInSeconds: number;
  label: string | null;
}

export interface CacheStats {
  name: string;
  totalEntries: number;
  maxSize: number;
  ttlSeconds: number;
  hits: number;
  misses: number;
  hitRate: number | null;
  entries: CacheEntryStats[];
}

export interface SessionInfo {
  active: boolean;
  expiresAt: string | null;
  expiresInSeconds: number;
}

export interface GetClubesOptions {
  filtro?: string | number;
  ordem?: string;
  pagina?: number;
  forceRefresh?: boolean;
}
