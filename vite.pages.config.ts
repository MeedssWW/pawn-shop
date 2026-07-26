import { defineConfig } from "vite";

export default defineConfig({
  root: "github-pages",
  base: "/pawn-shop/",
  publicDir: "public",
  build: {
    outDir: "../pages-dist",
    emptyOutDir: true,
  },
});
