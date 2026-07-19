import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDir, "../..");

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: [path.join(packageDir, "server/demo/test-setup.ts")],
    },
});
