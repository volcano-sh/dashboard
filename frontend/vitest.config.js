import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./tests/setupTests.js",
        coverage: {
            reporter: ["text", "lcov"],
        },
        // browser: {
        //     provider: "playwright",
        //     enabled: true,
        //     instances: [
        //         {
        //             browser: "chromium",
        //         },
        //     ],
        // },
    },
});
