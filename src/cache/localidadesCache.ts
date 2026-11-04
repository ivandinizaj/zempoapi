import { DataCache } from "./DataCache";
import type { LocalidadeList, Parsed } from "../types";

// Listas de cidades/bairros quase nunca mudam — TTL longo
export default new DataCache<Parsed<LocalidadeList>>({
  ttl: parseInt(process.env.LOCALIDADES_CACHE_TTL ?? "86400"),
  maxSize: parseInt(process.env.LOCALIDADES_CACHE_MAX_SIZE ?? "2000"),
  name: "LocalidadesCache",
  labelFn: (data) => `${data.itens.length} itens`,
});
