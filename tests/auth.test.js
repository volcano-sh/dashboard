import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adminHash =
    "$2b$12$LPJUlguhAzbmjP3CrGaPhuLUkBbi8GFKrIOGLBxJJgL2zSn00qoO.";

const writeAuthConfig = async (content) => {
    const dir = await mkdtemp(join(tmpdir(), "volcano-auth-"));
    const file = join(dir, "auth.yaml");
    await writeFile(file, content);
    return file;
};

const importAuth = async (configFile) => {
    vi.resetModules();
    if (configFile) {
        vi.stubEnv("DASHBOARD_CONFIG_FILE", configFile);
    } else {
        vi.unstubAllEnvs();
        delete process.env.DASHBOARD_CONFIG_FILE;
    }
    return import("../lib/server/auth.js");
};

const jsonRequest = (body) =>
    new Request("http://dashboard.local/api/v1/auth/local", {
        body: JSON.stringify(body),
        method: "POST",
    });

describe("auth server helpers", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        delete process.env.DASHBOARD_CONFIG_FILE;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        delete process.env.DASHBOARD_CONFIG_FILE;
    });

    it("uses the default local admin configuration when no auth file is set", async () => {
        const { handleLocalLogin, publicAuthConfig } = await importAuth();

        await expect(publicAuthConfig()).resolves.toEqual({
            localEnabled: true,
            mode: "local",
            providerName: "SSO",
            ssoEnabled: false,
        });

        const response = await handleLocalLogin(
            jsonRequest({
                password: "admin",
                username: "admin",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.token).toEqual(expect.any(String));
        expect(body.user).toMatchObject({
            displayName: "Administrator",
            provider: "local",
            username: "admin",
        });
    });

    it("rejects invalid local credentials", async () => {
        const { handleLocalLogin } = await importAuth();

        const response = await handleLocalLogin(
            jsonRequest({
                password: "wrong",
                username: "admin",
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toMatchObject({
            error: "Login failed",
            message: "Invalid username or password.",
        });
    });

    it("signs and verifies dashboard JWTs", async () => {
        const { signAuthToken, verifyAuthToken } = await importAuth();

        const signed = await signAuthToken(
            {
                displayName: "Administrator",
                provider: "local",
                username: "admin",
            },
            true,
        );
        const payload = await verifyAuthToken(signed.token);

        expect(payload.sub).toBe("admin");
        expect(payload.user).toMatchObject({
            displayName: "Administrator",
            provider: "local",
            username: "admin",
        });
        await expect(verifyAuthToken(`${signed.token}x`)).rejects.toThrow(
            /signature/i,
        );
    });

    it("protects handlers with bearer JWT authentication", async () => {
        const { signAuthToken, withAuth } = await importAuth();
        const guarded = withAuth(() => Response.json({ ok: true }));

        const missingToken = await guarded(new Request("http://dashboard/api"));
        expect(missingToken.status).toBe(401);

        const signed = await signAuthToken({ username: "admin" });
        const authorized = await guarded(
            new Request("http://dashboard/api", {
                headers: { Authorization: `Bearer ${signed.token}` },
            }),
        );

        expect(authorized.status).toBe(200);
        await expect(authorized.json()).resolves.toEqual({ ok: true });
    });

    it("exposes local-sso public config and builds an OIDC PKCE redirect", async () => {
        const configFile = await writeAuthConfig(`
auth:
  mode: local-sso
  jwt:
    issuer: volcano-dashboard-test
    secret: test-secret
  localUsers:
    - username: admin
      displayName: Administrator
      passwordHash: "${adminHash}"
  sso:
    providerName: Keycloak
    issuer: https://keycloak.example.com/realms/volcano
    clientId: volcano-dashboard
    clientSecret: dashboard-secret
    scopes:
      - openid
      - profile
      - email
`);
        const discovery = {
            authorization_endpoint:
                "https://keycloak.example.com/realms/volcano/protocol/openid-connect/auth",
            jwks_uri:
                "https://keycloak.example.com/realms/volcano/protocol/openid-connect/certs",
            token_endpoint:
                "https://keycloak.example.com/realms/volcano/protocol/openid-connect/token",
        };
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify(discovery), {
                    headers: { "Content-Type": "application/json" },
                    status: 200,
                }),
            ),
        );

        const { handleSsoStart, publicAuthConfig } =
            await importAuth(configFile);

        await expect(publicAuthConfig()).resolves.toEqual({
            localEnabled: true,
            mode: "local-sso",
            providerName: "Keycloak",
            ssoEnabled: true,
        });

        const response = await handleSsoStart(
            new Request("http://dashboard.local/api/v1/auth/sso/start"),
        );
        const location = new URL(response.headers.get("location"));

        expect(response.status).toBe(302);
        expect(location.origin).toBe("https://keycloak.example.com");
        expect(location.searchParams.get("client_id")).toBe(
            "volcano-dashboard",
        );
        expect(location.searchParams.get("code_challenge_method")).toBe("S256");
        expect(location.searchParams.get("code_challenge")).toBeTruthy();
        expect(location.searchParams.get("redirect_uri")).toBe(
            "http://dashboard.local/api/v1/auth/sso/callback",
        );
        expect(location.searchParams.get("scope")).toBe("openid profile email");
        expect(location.searchParams.get("state")).toBeTruthy();
    });

    it("accepts auth section config with snake_case option names", async () => {
        const configFile = await writeAuthConfig(`
auth:
  mode: local-sso
  salt: section-secret
  users:
    - username: admin
      display_name: Administrator
      password_hash: "${adminHash}"
      tenants:
        - adak8s
      is_admin: true
  sso:
    provider_name: Keycloak
    issuer_url: http://localhost:8080/realms/adak8s
    client_id: squidflow-backend
    client_secret: dashboard-secret
    redirect_uri: http://localhost:3000/sso/callback
    jwks_cache_ttl: 10m
    scopes:
      - openid
      - profile
      - email
      - offline_access
`);
        const discovery = {
            authorization_endpoint:
                "http://localhost:8080/realms/adak8s/protocol/openid-connect/auth",
            jwks_uri:
                "http://localhost:8080/realms/adak8s/protocol/openid-connect/certs",
            token_endpoint:
                "http://localhost:8080/realms/adak8s/protocol/openid-connect/token",
        };
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify(discovery), {
                    headers: { "Content-Type": "application/json" },
                    status: 200,
                }),
            ),
        );

        const { getAuthConfig, handleSsoStart, publicAuthConfig } =
            await importAuth(configFile);

        await expect(publicAuthConfig()).resolves.toMatchObject({
            mode: "local-sso",
            providerName: "Keycloak",
            ssoEnabled: true,
        });
        await expect(getAuthConfig()).resolves.toMatchObject({
            jwt: { secret: "section-secret" },
            localUsers: [
                {
                    displayName: "Administrator",
                    isAdmin: true,
                    passwordHash: adminHash,
                    tenants: ["adak8s"],
                    username: "admin",
                },
            ],
            sso: {
                clientId: "squidflow-backend",
                clientSecret: "dashboard-secret",
                issuer: "http://localhost:8080/realms/adak8s",
                jwksCacheTtl: "10m",
                redirectUri: "http://localhost:3000/sso/callback",
            },
        });

        const response = await handleSsoStart(
            new Request("http://dashboard.local/api/v1/auth/sso/start"),
        );
        const location = new URL(response.headers.get("location"));

        expect(location.searchParams.get("client_id")).toBe(
            "squidflow-backend",
        );
        expect(location.searchParams.get("scope")).toBe(
            "openid profile email offline_access",
        );
    });

    it("rejects invalid auth configuration files", async () => {
        const configFile = await writeAuthConfig(`
auth:
  mode: local-sso
  jwt:
    secret: test-secret
  localUsers: []
`);
        const { getAuthConfig } = await importAuth(configFile);

        await expect(getAuthConfig()).rejects.toThrow(
            /at least one local user/i,
        );
    });
});
