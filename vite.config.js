import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/OmniServiceTG/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
