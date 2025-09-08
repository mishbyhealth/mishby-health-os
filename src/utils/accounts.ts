// src/utils/accounts.ts
// Owner Accounts (foundation + migration + actions)

export type AccountIndex = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tags?: string[];
  updatedAt: string; // ISO
  archived?: boolean;
};

const K_INDEX = "glowell:accounts:index";
const K_CURRENT = "glowell:account:current";

// Legacy single-user keys (kept!)
export const K_LEGACY_INTAKE = "glowell:intake.v2";
export const K_LEGACY_TODAY = "glowell:daily";
export const K_LEGACY_LABS = "glowell:labs";

// Per-account keys
export const kIntake = (id: string) => `glowell:account:${id}:intake.v2`;
export const kToday  = (id: string) => `glowell:account:${id}:daily`;
export const kLabs   = (id: string) => `glowell:account:${id}:labs`;

export function nowISO() { return new Date().toISOString(); }

function loadJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; }
  catch { return fallback; }
}
function saveJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function getIndex(): AccountIndex[] { return loadJSON<AccountIndex[]>(K_INDEX, []); }
export function saveIndex(list: AccountIndex[]) { saveJSON(K_INDEX, list); }

export function getCurrentId(): string {
  return localStorage.getItem(K_CURRENT) || "self";
}
export function setCurrentId(id: string) {
  localStorage.setItem(K_CURRENT, id);
  window.dispatchEvent(new CustomEvent("glowell:accountchange", { detail: id }));
}

export function ensureId(slug: string): string {
  return slug.toLowerCase().trim()
    .replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "user";
}

export function listActive(): AccountIndex[] {
  return getIndex().filter(a => !a.archived).sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));
}
export function listArchived(): AccountIndex[] {
  return getIndex().filter(a => !!a.archived).sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));
}

export function upsertAccount(a: AccountIndex) {
  const list = getIndex();
  const i = list.findIndex(x => x.id === a.id);
  if (i >= 0) list[i] = { ...list[i], ...a };
  else list.push(a);
  saveIndex(list);
}

export function createAccount(name: string, phone?: string, email?: string): AccountIndex {
  const id = ensureId(name || "person");
  const a: AccountIndex = { id, name: name || id, phone, email, tags: [], updatedAt: nowISO() };
  upsertAccount(a);
  return a;
}

export function archiveAccount(id: string) {
  const list = getIndex();
  const i = list.findIndex(a => a.id === id);
  if (i >= 0) { list[i].archived = true; list[i].updatedAt = nowISO(); saveIndex(list); }
}
export function unarchiveAccount(id: string) {
  const list = getIndex();
  const i = list.findIndex(a => a.id === id);
  if (i >= 0) { delete list[i].archived; list[i].updatedAt = nowISO(); saveIndex(list); }
}

export function touchAccountUpdatedAt(id: string) {
  const list = getIndex();
  const i = list.findIndex(a => a.id === id);
  if (i >= 0) { list[i].updatedAt = nowISO(); saveIndex(list); }
}

function normTags(tags?: string[] | null): string[] {
  return Array.from(new Set((tags || []).map(t => t.trim()).filter(Boolean)));
}
export function setTags(id: string, tags: string[]) {
  const list = getIndex();
  const i = list.findIndex(a => a.id === id);
  if (i >= 0) {
    list[i].tags = normTags(tags);
    list[i].updatedAt = nowISO();
    saveIndex(list);
  }
}
export function addTag(id: string, tag: string) {
  const list = getIndex();
  const i = list.findIndex(a => a.id === id);
  if (i >= 0) {
    list[i].tags = normTags([...(list[i].tags || []), tag]);
    list[i].updatedAt = nowISO();
    saveIndex(list);
  }
}
export function removeTag(id: string, tag: string) {
  const list = getIndex();
  const i = list.findIndex(a => a.id === id);
  if (i >= 0) {
    list[i].tags = normTags((list[i].tags || []).filter(t => t !== tag));
    list[i].updatedAt = nowISO();
    saveIndex(list);
  }
}

export function updateContact(id: string, patch: Partial<Pick<AccountIndex, "name"|"phone"|"email">>) {
  const list = getIndex();
  const i = list.findIndex(a => a.id === id);
  if (i >= 0) {
    list[i] = { ...list[i], ...patch, updatedAt: nowISO() };
    saveIndex(list);
  }
}

export function searchAccounts(q: string): AccountIndex[] {
  const s = q.trim().toLowerCase();
  if (!s) return listActive();
  return listActive().filter(r => {
    const hay = [
      r.id, r.name, r.phone || "", r.email || "",
      ...(r.tags || [])
    ].join(" ").toLowerCase();
    return hay.includes(s);
  });
}

export function exportAccount(id: string) {
  const payload = {
    meta: { id, exportedAt: nowISO() },
    intake: loadJSON<any>(kIntake(id), null as any),
    today : loadJSON<any>(kToday(id),  null as any),
    labs  : loadJSON<any>(kLabs(id),   null as any),
  };
  return payload;
}

export function importAccount(id: string, name: string, payload: any) {
  const a: AccountIndex = { id, name, updatedAt: nowISO() };
  upsertAccount(a);
  if (payload?.intake) saveJSON(kIntake(id), payload.intake);
  if (payload?.today ) saveJSON(kToday(id),  payload.today );
  if (payload?.labs  ) saveJSON(kLabs(id),   payload.labs  );
  setCurrentId(id);
  return a;
}

/** One-time migration: create "Self" and copy legacy keys if index empty */
export function bootAccountsMigration() {
  const index = getIndex();
  if (index.length === 0) {
    const self: AccountIndex = { id: "self", name: "Self", updatedAt: nowISO(), tags: [] };
    saveIndex([self]);
    try {
      const intake = localStorage.getItem(K_LEGACY_INTAKE);
      const today  = localStorage.getItem(K_LEGACY_TODAY);
      const labs   = localStorage.getItem(K_LEGACY_LABS);
      if (intake) localStorage.setItem(kIntake("self"), intake);
      if (today)  localStorage.setItem(kToday("self"),  today);
      if (labs)   localStorage.setItem(kLabs("self"),   labs);
    } catch {}
    if (!localStorage.getItem(K_CURRENT)) setCurrentId("self");
  } else {
    if (!localStorage.getItem(K_CURRENT)) setCurrentId(index[0].id);
  }
}
