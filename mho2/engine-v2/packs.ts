// mho2/engine-v2/packs.ts
// Compatibility shim — forwards to the canonical loader in src/utils/packs.
// Do not add logic here. Keeps old API names working without "@/..." alias.

export type { PacksMap, PacksResult } from "../../src/utils/packs";

import { ensurePacksLoaded as _ensurePacksLoaded } from "../../src/utils/packs";

// Old API name (backward-compat):
export async function loadPacks() {
  return _ensurePacksLoaded();
}

// Preferred API:
export const ensurePacksLoaded = _ensurePacksLoaded;
export default ensurePacksLoaded;

// Legacy shape kept for older callers that still import `Pack`
export type Pack = { name?: string; tips?: Array<{ text: string; pack?: string }> };
