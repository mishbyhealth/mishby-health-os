// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // mho और mho2 => REPO ROOT पर (src के अंदर नहीं!)
      mho: path.resolve(__dirname, "mho"),
      mho2: path.resolve(__dirname, "mho2"),
    },
  },
});
