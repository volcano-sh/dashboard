import path from "path";
import { fileURLToPath } from "url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDir, "../../../..");

process.chdir(repoRoot);
process.env.DASHBOARD_DEMO_MODE = "true";
