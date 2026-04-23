import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        include: ["tests/**/*.{test,spec}.{js,jsx}"],
        exclude: ["frontend/**", "backend/**", "node_modules/**"],
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
