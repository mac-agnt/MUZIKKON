import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The whole demo ships as one bundle (about 1 MB, 270 kB gzipped).
  build: { chunkSizeWarningLimit: 1200 },
});
