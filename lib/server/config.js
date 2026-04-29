import { readFile } from "node:fs/promises";
import yaml from "js-yaml";

export const defaultDashboardConfig = {
    auth: {
        mode: "local",
        jwt: {
            issuer: "volcano-dashboard",
            expiresIn: "8h",
            rememberExpiresIn: "30d",
            secret: "volcano-dashboard-dev-secret",
        },
        localUsers: [
            {
                displayName: "Administrator",
                passwordHash:
                    "$2b$12$LPJUlguhAzbmjP3CrGaPhuLUkBbi8GFKrIOGLBxJJgL2zSn00qoO.",
                username: "admin",
            },
        ],
    },
    schedulerConfig: {
        namespace: "volcano-system",
        name: "volcano-scheduler-configmap",
        key: "",
    },
};

let cachedConfig;

const mergeSection = (defaults, overrides) => ({
    ...defaults,
    ...(overrides || {}),
});

export const normalizeDashboardConfig = (parsed = {}) => ({
    ...parsed,
    auth: mergeSection(defaultDashboardConfig.auth, parsed.auth),
    schedulerConfig: mergeSection(
        defaultDashboardConfig.schedulerConfig,
        parsed.schedulerConfig,
    ),
});

export const getDashboardConfig = async () => {
    if (cachedConfig) return cachedConfig;

    const configPath = process.env.DASHBOARD_CONFIG_FILE;
    if (!configPath) {
        cachedConfig = defaultDashboardConfig;
        return cachedConfig;
    }

    const raw = await readFile(configPath, "utf8");
    const parsed = configPath.endsWith(".json")
        ? JSON.parse(raw)
        : yaml.load(raw);

    cachedConfig = normalizeDashboardConfig(parsed || {});
    return cachedConfig;
};
