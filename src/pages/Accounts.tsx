// src/pages/Accounts.tsx
// Owner-only Accounts page (rename, tags, export/import, soft-archive)

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  listActive, listArchived, createAccount, setCurrentId, getCurrentId,
  exportAccount, importAccount, archiveAccount, unarchiveAccount,
  AccountIndex, nowISO, searchAccounts, updateContact, setTags
} from "@/utils/accounts";
import { isOwnerActive } from "@/utils/mode";

function TagEditor({
  value, onChange,
}: { value: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = React.useState(value.join(", "));
  React.useEffect(() => { setText(value.join(", ")); }, [value]);
  const apply = () => {
    const tags = Array.from(new Set(text.split(",").map(t => t.trim()).filter(Boolean)));
    onChange(tags);
  };
  return (
    <div className="gw-row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
      <input className="gw-input" value={text} onChange={e=>setText(e.target.value)} placeholder="comma-separated tags"/>
      <button className="gw-btn" onClick={apply}>Apply</button>
    </div>
  );
}

export default function AccountsPage() {
  const nav = useNavigate();
  const [ownerOK, setOwnerOK] = React.useState(isOwnerActive());
  React.useEffect(() => {
    if (!ownerOK) nav("/", { replace: true });
    const onAuth = (e: any) => setOwnerOK(!!e.detail);
    const onMode = () => setOwnerOK(isOwnerActive());
    window.addEventListener("glowell:ownerauthchange", onAuth as EventListener);
    window.addEventListener("glowell:modechange", onMode as EventListener);
    return () => {
      window.removeEventListener("glowell:ownerauthchange", onAuth as EventListener);
      window.removeEventListener("glowell:modechange", onMode as EventListener);
    };
  }, [ownerOK, nav]);
  if (!ownerOK) return null;

  // Data state
  const [rows, setRows] = React.useState<AccountIndex[]>(listActive());
  const [archived, setArchived] = React.useState<AccountIndex[]>(listArchived());
  const refresh = () => { setRows(listActive()); setArchived(listArchived()); };

  // Create form
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Find/search
  const [query, setQuery] = React.useState("");
  React.useEffect(() => { setRows(searchAccounts(query)); }, [query]);

  const current = getCurrentId();

  const onCreate = () => {
    const a = createAccount(name || "Person", phone || undefined, email || undefined);
    setName(""); setPhone(""); setEmail("");
    setCurrentId(a.id);
    refresh();
  };

  const onOpen = (id: string) => { setCurrentId(id); refresh(); alert(`Opened account: ${id}`); };

  const onExport = (id: string) => {
    const payload = exportAccount(id);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `glowell-account-${id}-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onImport = () => {
    const text = prompt("Paste account JSON"); if (!text) return;
    try {
      const data = JSON.parse(text);
      const id = (data?.meta?.id as string) || `acc-${Date.now()}`;
      const nm = rows.find(r => r.id === id)?.name || (data?.meta?.name as string) || id;
      importAccount(id, nm, data); refresh(); alert("Imported.");
    } catch { alert("Invalid JSON."); }
  };

  const onArchive = (id: string) => {
    if (!confirm(`Archive "${id}"? You can unarchive later.`)) return;
    if (id === "self") { alert('Cannot archive "Self".'); return; }
    archiveAccount(id);
    refresh();
  };
  const onUnarchive = (id: string) => { unarchiveAccount(id); refresh(); };

  // Inline edit row
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editTags, setEditTags] = React.useState<string[]>([]);

  const startEdit = (r: AccountIndex) => {
    setEditing(r.id);
    setEditName(r.name || "");
    setEditPhone(r.phone || "");
    setEditEmail(r.email || "");
    setEditTags(r.tags || []);
  };
  const cancelEdit = () => { setEditing(null); };
  const saveEdit = (id: string) => {
    updateContact(id, { name: editName, phone: editPhone, email: editEmail });
    setTags(id, editTags);
    refresh();
    setEditing(null);
  };

  return (
    <div className="gw-page">
      <div className="gw-tint">

        {/* Header */}
        <div className="gw-card">
          <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="text-xl">Accounts (Owner-only)</h2>
            <div className="gw-row" style={{ gap: "0.5rem", alignItems: "center" }}>
              <div className="gw-badge">Current: {current || "—"}</div>
              <input className="gw-input" placeholder="Search name / phone / email / tag" value={query} onChange={e=>setQuery(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Create */}
        <div className="gw-card" style={{ marginTop: "0.75rem" }}>
          <h3 className="text-lg">Create New</h3>
          <div className="gw-row" style={{ gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <input className="gw-input" placeholder="Name"  value={name}  onChange={e => setName(e.target.value)} />
            <input className="gw-input" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <input className="gw-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="gw-btn" onClick={onCreate}>New</button>
            <button className="gw-btn" onClick={onImport}>Import JSON…</button>
          </div>
        </div>

        {/* Active list */}
        <div className="gw-card" style={{ marginTop: "0.75rem" }}>
          <h3 className="text-lg">People</h3>
          {rows.length === 0 && <div className="gw-tint" style={{ padding: "0.75rem", borderRadius: "0.5rem" }}>No accounts match.</div>}
          {rows.length > 0 && (
            <div className="gw-table mt-2" role="table" aria-label="Accounts">
              <div className="gw-row" style={{ fontWeight: 600 }}>
                <div style={{ width: "24%" }}>Name</div>
                <div style={{ width: "22%" }}>Phone / Email</div>
                <div style={{ width: "26%" }}>Tags</div>
                <div style={{ width: "14%" }}>Last Update</div>
                <div style={{ width: "14%" }}>Actions</div>
              </div>
              {rows.map(r => (
                <div className="gw-row" key={r.id} style={{ alignItems: "center", padding: "0.5rem 0" }}>
                  {/* Name */}
                  <div style={{ width: "24%" }}>
                    {editing === r.id ? (
                      <input className="gw-input" value={editName} onChange={e=>setEditName(e.target.value)} />
                    ) : (
                      <>
                        <div>{r.name}</div>
                        <div className="text-xs text-neutral-500">id: {r.id}</div>
                      </>
                    )}
                  </div>

                  {/* Contact */}
                  <div style={{ width: "22%" }}>
                    {editing === r.id ? (
                      <>
                        <input className="gw-input" placeholder="Phone" value={editPhone} onChange={e=>setEditPhone(e.target.value)} />
                        <input className="gw-input" placeholder="Email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} style={{ marginTop: "0.25rem" }}/>
                      </>
                    ) : (
                      <>
                        <div className="text-sm">{r.phone || "—"}</div>
                        <div className="text-xs text-neutral-500">{r.email || "—"}</div>
                      </>
                    )}
                  </div>

                  {/* Tags */}
                  <div style={{ width: "26%" }}>
                    {editing === r.id ? (
                      <TagEditor value={editTags} onChange={setEditTags} />
                    ) : (
                      <div className="gw-row" style={{ gap: "0.25rem", flexWrap: "wrap" }}>
                        {(r.tags || []).length === 0 && <span className="text-sm text-neutral-500">—</span>}
                        {(r.tags || []).map(t => <span key={t} className="gw-badge">{t}</span>)}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div style={{ width: "14%" }}>{new Date(r.updatedAt || nowISO()).toLocaleString()}</div>

                  {/* Actions */}
                  <div style={{ width: "14%", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {editing === r.id ? (
                      <>
                        <button className="gw-btn" onClick={()=>saveEdit(r.id)}>Save</button>
                        <button className="gw-btn" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="gw-btn" onClick={() => onOpen(r.id)}>Open</button>
                        <button className="gw-btn" onClick={() => setEditing(r.id)}>Edit</button>
                        <button className="gw-btn" onClick={() => onExport(r.id)}>Export</button>
                        {r.id !== "self" && <button className="gw-btn" onClick={() => onArchive(r.id)}>Archive</button>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archived */}
        {archived.length > 0 && (
          <div className="gw-card" style={{ marginTop: "0.75rem" }}>
            <h3 className="text-lg">Archived</h3>
            <div className="gw-table mt-2" role="table" aria-label="Archived Accounts">
              <div className="gw-row" style={{ fontWeight: 600 }}>
                <div style={{ width: "30%" }}>Name</div>
                <div style={{ width: "30%" }}>Phone / Email</div>
                <div style={{ width: "20%" }}>Last Update</div>
                <div style={{ width: "20%" }}>Actions</div>
              </div>
              {archived.map(r => (
                <div className="gw-row" key={r.id} style={{ alignItems: "center", padding: "0.5rem 0" }}>
                  <div style={{ width: "30%" }}>
                    <div>{r.name}</div>
                    <div className="text-xs text-neutral-500">id: {r.id}</div>
                  </div>
                  <div style={{ width: "30%" }}>
                    <div className="text-sm">{r.phone || "—"}</div>
                    <div className="text-xs text-neutral-500">{r.email || "—"}</div>
                  </div>
                  <div style={{ width: "20%" }}>{new Date(r.updatedAt || nowISO()).toLocaleString()}</div>
                  <div style={{ width: "20%", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button className="gw-btn" onClick={() => onUnarchive(r.id)}>Unarchive</button>
                    <button className="gw-btn" onClick={() => onExport(r.id)}>Export</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <div className="gw-tint" style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem" }}>
          <div className="text-sm">
            <b>Tip:</b> Use <i>Edit</i> to update Name / Phone / Email / Tags. Archive hides an account without deleting data.<br/>
            From <b>Step 2</b>, forms & plans already use the <i>current account</i>. This step adds convenience tools only.
          </div>
        </div>
      </div>
    </div>
  );
}
