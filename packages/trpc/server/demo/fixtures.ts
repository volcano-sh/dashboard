import fs from "fs";
import path from "path";
import yaml from "js-yaml";

type K8sObject = {
    apiVersion?: string;
    kind?: string;
    metadata?: { name?: string; namespace?: string; deletionTimestamp?: unknown };
    spec?: Record<string, unknown>;
    status?: Record<string, unknown>;
};

const FIXTURE_FILES = [
    "00-namespaces.yaml",
    "10-queues.yaml",
    "20-podgroups.yaml",
    "30-pods.yaml",
    "40-jobs.yaml",
];

let cached: {
    queues: K8sObject[];
    jobs: K8sObject[];
    pods: K8sObject[];
    podgroups: K8sObject[];
} | null = null;

function resolveSamplesDir(): string {
    let dir = process.cwd();
    for (let depth = 0; depth < 6; depth += 1) {
        const candidate = path.join(dir, "examples", "cluster-samples");
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    throw new Error(
        "Could not locate examples/cluster-samples. Run from the repository root.",
    );
}

function loadDocuments(filePath: string): K8sObject[] {
    const raw = fs.readFileSync(filePath, "utf8");
    return yaml.loadAll(raw).filter(Boolean) as K8sObject[];
}

export function loadDemoFixtures() {
    if (cached) {
        return cached;
    }

    const samplesDir = resolveSamplesDir();
    const all: K8sObject[] = [];

    for (const file of FIXTURE_FILES) {
        all.push(...loadDocuments(path.join(samplesDir, file)));
    }

    cached = {
        queues: all.filter((item) => item.kind === "Queue"),
        jobs: all.filter((item) => item.kind === "Job"),
        pods: all.filter((item) => item.kind === "Pod"),
        podgroups: all.filter((item) => item.kind === "PodGroup"),
    };

    return cached;
}

export function resetDemoFixturesCache() {
    cached = null;
}
