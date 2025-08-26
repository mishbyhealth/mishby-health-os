import React, { useEffect, useState } from "react";

type Post = {
  id: string;
  name: string;     // e.g., "Me"
  text: string;     // message
  likes: number;
  ts: number;       // epoch ms
};

const LS_KEY = "glowell.community.v1";

function load(): Post[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function save(list: Post[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>(() => {
    const arr = load();
    if (arr.length) return arr;
    // seed with 3 gentle examples
    return [
      { id: crypto.randomUUID(), name: "Asha", text: "5-min evening walk helped me sleep better 🌙", likes: 3, ts: Date.now() - 86400000 },
      { id: crypto.randomUUID(), name: "Ravi", text: "Added sprouts to breakfast. Feel lighter!", likes: 5, ts: Date.now() - 43200000 },
      { id: crypto.randomUUID(), name: "Neel", text: "Sipping water every hour. Energy is steadier 💧", likes: 2, ts: Date.now() - 3600000 },
    ];
  });

  const [name, setName] = useState("Me");
  const [text, setText] = useState("");

  useEffect(() => save(posts), [posts]);

  const addPost = () => {
    const t = text.trim();
    if (!t) return;
    const p: Post = { id: crypto.randomUUID(), name: name.trim() || "Me", text: t, likes: 0, ts: Date.now() };
    setPosts((x) => [p, ...x]);
    setText("");
  };

  const like = (id: string) =>
    setPosts((x) => x.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));

  const remove = (id: string) =>
    setPosts((x) => x.filter((p) => p.id !== id));

  const clear = () => {
    if (confirm("Clear all community posts?")) setPosts([]);
  };

  const fmt = (n: number) => new Date(n).toLocaleString();

  return (
    <div className="card" style={{ padding: 16, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>Community</h3>
        <button className="btn" onClick={clear}>Clear</button>
      </div>

      {/* composer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8, marginTop: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
        />
        <button className="btn btn-primary" onClick={addPost}>Share</button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share a gentle win or tip…"
        rows={3}
        style={{
          marginTop: 8, width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb",
          resize: "vertical"
        }}
      />

      {/* list */}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 14 }}>
        {posts.length === 0 && <li style={{ opacity: 0.7 }}>No posts yet. Share your first tip!</li>}
        {posts.map((p) => (
          <li key={p.id} className="card" style={{ padding: 12, borderRadius: 10, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{fmt(p.ts)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => like(p.id)}>👍 {p.likes}</button>
                <button className="btn" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
            <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{p.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
