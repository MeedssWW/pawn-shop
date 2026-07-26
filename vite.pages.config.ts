import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "github-pages",
  base: "/pawn-shop/",
  plugins: [react()],
  publicDir: "../public",
  build: {
    outDir: "../pages-dist",
    emptyOutDir: true,
  },
});
