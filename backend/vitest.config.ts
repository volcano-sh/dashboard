import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        // setupFiles: "./tests/setupTests.ts",
        coverage: {
            reporter: ["text", "lcov"],
        },
    },
});
