import { defineConfig } from "vite";

export default defineConfig({
  root: "github-pages",
  base: "./",
  publicDir: "public",
  build: {
    outDir: "../yandex-dist",
    emptyOutDir: true,
  },
});
