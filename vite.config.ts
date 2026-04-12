import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    sourcemap: true,
  },
  staged: {
    "*.{cjs,cts,js,json,md,mjs,mts,ts,yaml,yml}": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["dist/**"],
  },
  lint: {
    ignorePatterns: ["dist/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  run: {
    cache: true,
  },
});
