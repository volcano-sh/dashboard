import { readFile } from "node:fs/promises";
import yaml from "js-yaml";

export const defaultDashboardConfig = {
    access: {
        mode: "read-write",
    },
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

const normalizeAccessMode = (value) => {
    const normalized = String(value || defaultDashboardConfig.access.mode)
        .trim()
        .toLowerCase();
    return normalized;
};

export const normalizeDashboardConfig = (parsed: any = {}) => ({
    ...parsed,
    access: {
        ...mergeSection(defaultDashboardConfig.access, parsed.access),
        mode: normalizeAccessMode(parsed.access?.mode),
    },
    auth: mergeSection(defaultDashboardConfig.auth, parsed.auth),
    schedulerConfig: mergeSection(
        defaultDashboardConfig.schedulerConfig,
        parsed.schedulerConfig,
    ),
});

export const resolveDashboardConfigPath = () =>
    process.env.DASHBOARD_CONFIG_FILE || "";

export const getDashboardConfigSource = () => {
    const path = resolveDashboardConfigPath();
    return path
        ? {
              path,
              source: "file",
          }
        : {
              path: "",
              source: "default",
          };
};

export const getDashboardConfig = async () => {
    const configPath = resolveDashboardConfigPath();
    if (!configPath) {
        cachedConfig = defaultDashboardConfig;
        return cachedConfig;
    }

    const raw = await readFile(/* turbopackIgnore: true */ configPath, "utf8");
    const parsed = configPath.endsWith(".json")
        ? JSON.parse(raw)
        : yaml.load(raw);

    return normalizeDashboardConfig(parsed || {});
};
