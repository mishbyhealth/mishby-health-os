import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // src alias (keep using "@/...")
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },

      // ✅ root-level domain logic
      { find: "~mho2", replacement: fileURLToPath(new URL("./mho2", import.meta.url)) },
      { find: "~mho",  replacement: fileURLToPath(new URL("./mho",  import.meta.url)) },
    ],
  },
});
