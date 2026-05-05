import { DataCache } from "./DataCache";
import type { ClubDetails, Parsed } from "../types";

export default new DataCache<Parsed<ClubDetails>>({
  ttl: parseInt(process.env.CLUB_DETAILS_CACHE_TTL ?? "86400"),
  maxSize: parseInt(process.env.CLUB_DETAILS_CACHE_MAX_SIZE ?? "200"),
  name: "ClubDetailsCache",
  labelFn: (data) => data.nome ?? data.codigo ?? "",
});
