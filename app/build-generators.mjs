// 초등 연산 문제 생성기를 IIFE 번들로 빌드 → public/elementary-ai-math/generators.js
import { build } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  configFile: false,
  root: __dirname,
  build: {
    lib: {
      entry: resolve(__dirname, "src/generators-export.ts"),
      name: "PurunetGenerators",
      formats: ["iife"],
      fileName: () => "generators.js",
    },
    outDir: resolve(__dirname, "public/elementary-ai-math"),
    emptyOutDir: false,
    minify: true,
    rollupOptions: {
      output: { entryFileNames: "generators.js" },
    },
  },
});

console.log("✅ generators.js built successfully");
