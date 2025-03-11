import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        setupFiles: "./tests/setupTests.js",
        coverage: {
            reporter: ["text", "lcov"],
        },
    },
});
