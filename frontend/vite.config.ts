import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const basePath = process.env.GITHUB_PAGES_BASE ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000"
    }
  }
});
