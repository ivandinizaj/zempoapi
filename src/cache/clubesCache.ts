import { DataCache } from "./DataCache";
import type { ClubsPage } from "../types";

export default new DataCache<ClubsPage>({
  ttl: parseInt(process.env.CLUBES_CACHE_TTL ?? "172800"),
  maxSize: parseInt(process.env.CLUBES_CACHE_MAX_SIZE ?? "100"),
  name: "ClubesCache",
  labelFn: (data) => `${data.total} clubes`,
});
