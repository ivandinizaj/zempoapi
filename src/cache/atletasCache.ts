import { DataCache } from "./DataCache";
import type { Athlete, Parsed } from "../types";

export default new DataCache<Parsed<Athlete>>({
  ttl: parseInt(process.env.USER_DATA_CACHE_TTL ?? "3600"),
  maxSize: parseInt(process.env.ATLETAS_CACHE_MAX_SIZE ?? "1000"),
  name: "AtletasCache",
  labelFn: (data) => data.nomeCompleto,
});
