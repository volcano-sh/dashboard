import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    experimental: {
        outputFileTracingRoot: repoRoot,
        outputFileTracingIncludes: {
            "/api/trpc/[trpc]": ["../../examples/cluster-samples/**/*"],
        },
    },
};

export default nextConfig;
