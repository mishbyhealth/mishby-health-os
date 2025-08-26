import React from "react";

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <h1 style={{ marginBottom: 12 }}>GloWell ✅</h1>
      <p>अगर आप यह टेक्स्ट देख रहे हैं, तो Vite starter हट गया है और आपका App.tsx चल रहा है।</p>

      <div style={{ marginTop: 16 }}>
        <a href="/plan" style={{ marginRight: 12 }}>Open Plan page</a>
        <a href="/dashboard" style={{ marginRight: 12 }}>Dashboard</a>
        <a href="/health-plan" style={{ marginRight: 12 }}>Build Plan</a>
        <a href="/profile">Profile</a>
      </div>
    </div>
  );
}
