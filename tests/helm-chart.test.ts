import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

const chartPath = "./helm/volcano-dashboard";

const renderChart = (extraArgs: string[] = []) => {
    const rendered = execFileSync(
        "helm",
        [
            "template",
            "volcano-dashboard",
            chartPath,
            "-n",
            "volcano-system",
            ...extraArgs,
        ],
        {
            encoding: "utf8",
        },
    );
    return yaml.loadAll(rendered).filter(Boolean) as any[];
};

const findResource = (resources, kind, name) =>
    resources.find(
        (resource) =>
            resource?.kind === kind && resource?.metadata?.name === name,
    );

const dashboardConfig = (resources) => {
    const secret = findResource(resources, "Secret", "volcano-dashboard-config");
    expect(secret).toBeTruthy();
    return yaml.load(secret.stringData["dashboard.yaml"]) as any;
};

describe("volcano-dashboard Helm chart", () => {
    it("renders default local auth deployment config as read-only", () => {
        const resources = renderChart();

        expect(dashboardConfig(resources)).toMatchObject({
            access: {
                mode: "read-only",
            },
            auth: {
                enabled: true,
                jwt: {
                    expiresIn: "8h",
                    issuer: "volcano-dashboard",
                    rememberExpiresIn: "30d",
                    secret: "volcano-dashboard-dev-secret",
                },
                mode: "local",
                users: [
                    {
                        access_mode: "read-write",
                        display_name: "Administrator",
                        username: "admin",
                    },
                ],
            },
        });
    });

    it("renders local auth config with read-only/read-write access mapping", () => {
        const resources = renderChart([
            "--set",
            "config.data.auth.enabled=true",
            "--set",
            "config.data.auth.mode=local",
            "--set",
            "config.data.auth.jwt.secret=test-secret",
            "--set",
            "config.data.auth.users[0].username=admin",
            "--set",
            "config.data.auth.users[0].display_name=Administrator",
            "--set-string",
            "config.data.auth.users[0].password_hash=$2b$12$example",
            "--set",
            "config.data.auth.users[0].access_mode=read-write",
        ]);

        expect(dashboardConfig(resources)).toMatchObject({
            access: {
                mode: "read-only",
            },
            auth: {
                enabled: true,
                jwt: {
                    secret: "test-secret",
                },
                mode: "local",
                users: [
                    {
                        access_mode: "read-write",
                        display_name: "Administrator",
                        password_hash: "$2b$12$example",
                        username: "admin",
                    },
                ],
            },
        });
    });

    it("renders local-sso auth config with group access mappings", () => {
        const resources = renderChart([
            "--set",
            "config.data.auth.enabled=true",
            "--set",
            "config.data.auth.mode=local-sso",
            "--set",
            "config.data.auth.jwt.secret=test-secret",
            "--set",
            "config.data.auth.users[0].username=admin",
            "--set-string",
            "config.data.auth.users[0].password_hash=$2b$12$example",
            "--set",
            "config.data.auth.users[0].access_mode=read-write",
            "--set",
            "config.data.auth.sso.provider_name=Keycloak",
            "--set",
            "config.data.auth.sso.issuer_url=http://localhost:8080/realms/adak8s",
            "--set",
            "config.data.auth.sso.client_id=squidflow-backend",
            "--set",
            "config.data.auth.sso.client_secret=dashboard-secret",
            "--set",
            "config.data.auth.sso.redirect_uri=http://localhost:3000/sso/callback",
            "--set",
            "config.data.auth.sso.scopes[0]=openid",
            "--set",
            "config.data.auth.sso.scopes[1]=profile",
            "--set",
            "config.data.auth.sso.scopes[2]=email",
            "--set",
            "config.data.auth.sso.scopes[3]=groups",
            "--set",
            "config.data.auth.sso.group_mappings[0].match=adak8s-admins",
            "--set",
            "config.data.auth.sso.group_mappings[0].access_mode=read-write",
            "--set",
            "config.data.auth.sso.group_mappings[1].match=adak8s-viewers",
            "--set",
            "config.data.auth.sso.group_mappings[1].access_mode=read-only",
        ]);

        expect(dashboardConfig(resources)).toMatchObject({
            auth: {
                enabled: true,
                mode: "local-sso",
                sso: {
                    client_id: "squidflow-backend",
                    group_mappings: [
                        {
                            access_mode: "read-write",
                            match: "adak8s-admins",
                        },
                        {
                            access_mode: "read-only",
                            match: "adak8s-viewers",
                        },
                    ],
                    issuer_url: "http://localhost:8080/realms/adak8s",
                    scopes: ["openid", "profile", "email", "groups"],
                },
            },
        });
    });

    it("does not render SELinux options in pod or container security contexts", () => {
        const resources = renderChart();
        const deployment = findResource(
            resources,
            "Deployment",
            "volcano-dashboard",
        );

        expect(deployment).toBeTruthy();
        const podSecurityContext = deployment.spec.template.spec.securityContext;
        const containerSecurityContext =
            deployment.spec.template.spec.containers[0].securityContext;

        expect(podSecurityContext).not.toHaveProperty("seLinuxOptions");
        expect(podSecurityContext).not.toHaveProperty("seLinux");
        expect(containerSecurityContext).not.toHaveProperty("seLinuxOptions");
        expect(containerSecurityContext).not.toHaveProperty("seLinux");
    });
});
