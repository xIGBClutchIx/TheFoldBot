import { defineConfig } from "vite-plus";

export default defineConfig({
    pack: {
        entry: ["src/index.ts"],
        sourcemap: true,
    },
    staged: {
        "*.{cjs,cts,js,json,md,mjs,mts,ts,yaml,yml}": "vp check --fix && node scripts/check-strict-types.mjs",
    },
    fmt: {
        ignorePatterns: ["dist/**"],
        printWidth: 200,
        tabWidth: 4,
        useTabs: false,
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
