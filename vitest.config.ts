import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        include: ["tests/**/*.{test,spec}.{js,jsx,ts,tsx}"],
        exclude: ["frontend/**", "backend/**", "node_modules/**"],
        environment: "jsdom",
        globals: true,
        setupFiles: "./tests/setupTests.ts",
        coverage: {
            provider: "v8",
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
