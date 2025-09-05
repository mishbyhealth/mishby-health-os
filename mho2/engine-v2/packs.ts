// mho2/engine-v2/packs.ts
// Compatibility shim — single source of truth is src/utils/packs.ts
// (Per your rule: going forward, keep all packs logic in src/utils/packs.ts)

export type { PacksMap, PacksResult } from "../../src/utils/packs";
export {
  ensurePacksLoaded,
  getPacksResult,
  isPacksReady,
} from "../../src/utils/packs";
