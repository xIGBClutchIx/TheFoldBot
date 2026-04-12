import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{cjs,cts,js,json,md,mjs,mts,ts,yaml,yml}": "vp check --fix",
  },
  fmt: {},
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  run: {
    cache: true,
  },
});
