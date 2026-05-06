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
    return import("../lib/server/auth");
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
            accessMode: "read-write",
            authRequired: true,
            canRead: false,
            canWrite: false,
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
            accessMode: "read-write",
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
            accessMode: "read-only",
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
    redirectUri: http://dashboard.local/custom/sso/callback
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
            accessMode: "read-write",
            authRequired: true,
            canRead: false,
            canWrite: false,
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
            "http://dashboard.local/custom/sso/callback",
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
      access_mode: read-write
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
                    accessMode: "read-write",
                    displayName: "Administrator",
                    passwordHash: adminHash,
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
        expect(location.searchParams.get("redirect_uri")).toBe(
            "http://localhost:3000/sso/callback",
        );
    });

    it("resolves local user access modes with the global access ceiling", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-write
auth:
  enabled: true
  mode: local
  jwt:
    secret: test-secret
  users:
    - username: admin
      display_name: Administrator
      password_hash: "${adminHash}"
      access_mode: read-write
`);
        const { handleLocalLogin, withWrite } = await importAuth(configFile);

        const loginResponse = await handleLocalLogin(
            jsonRequest({ password: "admin", username: "admin" }),
        );
        const loginBody = await loginResponse.json();
        expect(loginBody.user).toMatchObject({ accessMode: "read-write" });

        const writeResponse = await withWrite(() =>
            Response.json({ ok: true }),
        )(
            new Request("http://dashboard.local/api/v1/queues", {
                headers: { Authorization: `Bearer ${loginBody.token}` },
            }),
        );
        expect(writeResponse.status).toBe(200);
    });

    it("caps local read-write users to read-only when the global ceiling is read-only", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-only
auth:
  enabled: true
  mode: local
  jwt:
    secret: test-secret
  users:
    - username: admin
      display_name: Administrator
      password_hash: "${adminHash}"
      access_mode: read-write
`);
        const { handleLocalLogin, withWrite } = await importAuth(configFile);

        const loginResponse = await handleLocalLogin(
            jsonRequest({ password: "admin", username: "admin" }),
        );
        const loginBody = await loginResponse.json();
        expect(loginBody.user).toMatchObject({ accessMode: "read-only" });

        const writeResponse = await withWrite(() =>
            Response.json({ ok: true }),
        )(
            new Request("http://dashboard.local/api/v1/queues", {
                headers: { Authorization: `Bearer ${loginBody.token}` },
            }),
        );
        expect(writeResponse.status).toBe(404);
    });

    it("defaults local users without access_mode to read-only", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-write
auth:
  enabled: true
  mode: local
  jwt:
    secret: test-secret
  users:
    - username: viewer
      display_name: Viewer
      password_hash: "${adminHash}"
`);
        const { handleLocalLogin, withWrite } = await importAuth(configFile);

        const loginResponse = await handleLocalLogin(
            jsonRequest({ password: "admin", username: "viewer" }),
        );
        const loginBody = await loginResponse.json();
        expect(loginBody.user).toMatchObject({ accessMode: "read-only" });

        const writeResponse = await withWrite(() =>
            Response.json({ ok: true }),
        )(
            new Request("http://dashboard.local/api/v1/queues", {
                headers: { Authorization: `Bearer ${loginBody.token}` },
            }),
        );
        expect(writeResponse.status).toBe(403);
    });

    it("resolves SSO group mappings to access modes", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-write
auth:
  enabled: true
  mode: local-sso
  jwt:
    secret: test-secret
  users:
    - username: admin
      display_name: Administrator
      password_hash: "${adminHash}"
      access_mode: read-write
  sso:
    issuer_url: http://localhost:8080/realms/adak8s
    client_id: squidflow-backend
    group_mappings:
      - match: adak8s-admins
        access_mode: read-write
      - match: adak8s-viewers
        access_mode: read-only
`);
        const { oidcAccessGroups, resolveSsoAccessMode } =
            await importAuth(configFile);

        expect(
            oidcAccessGroups({
                groups: ["adak8s-users"],
                realm_access: { roles: ["adak8s-admins"] },
                resource_access: {
                    volcano: { roles: ["dashboard-role"] },
                },
            }),
        ).toEqual(["adak8s-users", "adak8s-admins", "dashboard-role"]);
        await expect(
            resolveSsoAccessMode({
                groups: ["adak8s-admins"],
            }),
        ).resolves.toBe("read-write");
        await expect(
            resolveSsoAccessMode({
                groups: ["adak8s-viewers"],
            }),
        ).resolves.toBe("read-only");
        await expect(
            resolveSsoAccessMode({
                groups: ["unmapped"],
            }),
        ).resolves.toBe("read-only");
    });

    it("caps SSO group mappings with the global access ceiling", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-only
auth:
  enabled: true
  mode: local-sso
  jwt:
    secret: test-secret
  users:
    - username: admin
      passwordHash: "${adminHash}"
      accessMode: read-write
  sso:
    issuer: http://localhost:8080/realms/adak8s
    clientId: squidflow-backend
    groupMappings:
      - match: adak8s-admins
        accessMode: read-write
`);
        const { resolveSsoAccessMode } = await importAuth(configFile);

        await expect(
            resolveSsoAccessMode({ groups: ["adak8s-admins"] }),
        ).resolves.toBe("read-only");
    });

    it("maps anonymous read-only mode when auth is disabled", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-only
auth:
  enabled: false
`);
        const { handleAuthMe, publicAuthConfig, withRead, withWrite } =
            await importAuth(configFile);

        await expect(publicAuthConfig()).resolves.toEqual({
            accessMode: "read-only",
            authRequired: false,
            canRead: true,
            canWrite: false,
            localEnabled: false,
            mode: "disabled",
            providerName: "SSO",
            ssoEnabled: false,
        });

        const meResponse = await handleAuthMe(
            new Request("http://dashboard.local/api/v1/auth/me"),
        );
        await expect(meResponse.json()).resolves.toMatchObject({
            identity: {
                accessMode: "read-only",
                type: "anonymous",
                username: "anonymous",
            },
            user: null,
        });

        const readResponse = await withRead(() => Response.json({ ok: true }))(
            new Request("http://dashboard.local/api/v1/queues"),
        );
        expect(readResponse.status).toBe(200);

        const readWithTokenResponse = await withRead(() =>
            Response.json({ ok: true }),
        )(
            new Request("http://dashboard.local/api/v1/jobs", {
                headers: { Authorization: "Bearer stale-token" },
            }),
        );
        expect(readWithTokenResponse.status).toBe(200);

        const writeResponse = await withWrite(() =>
            Response.json({ ok: true }),
        )(new Request("http://dashboard.local/api/v1/queues"));
        expect(writeResponse.status).toBe(404);
        await expect(writeResponse.json()).resolves.toMatchObject({
            error: "Not Found",
        });
    });

    it("requires authentication in read-only mode when auth is enabled", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-only
auth:
  enabled: true
  mode: local
  jwt:
    secret: test-secret
  localUsers:
    - username: admin
      displayName: Administrator
      passwordHash: "${adminHash}"
`);
        const {
            handleAuthMe,
            handleLocalLogin,
            publicAuthConfig,
            withRead,
            withWrite,
        } = await importAuth(configFile);

        await expect(publicAuthConfig()).resolves.toEqual({
            accessMode: "read-only",
            authRequired: true,
            canRead: false,
            canWrite: false,
            localEnabled: true,
            mode: "local",
            providerName: "SSO",
            ssoEnabled: false,
        });

        const unauthenticatedRead = await withRead(() =>
            Response.json({ ok: true }),
        )(new Request("http://dashboard.local/api/v1/queues"));
        expect(unauthenticatedRead.status).toBe(401);

        const loginResponse = await handleLocalLogin(
            jsonRequest({ password: "admin", username: "admin" }),
        );
        const loginBody = await loginResponse.json();
        expect(loginBody.user).toMatchObject({ accessMode: "read-only" });
        const request = new Request("http://dashboard.local/api/v1/queues", {
            headers: { Authorization: `Bearer ${loginBody.token}` },
        });

        const readResponse = await withRead(() => Response.json({ ok: true }))(
            request,
        );
        expect(readResponse.status).toBe(200);

        const writeResponse = await withWrite(() =>
            Response.json({ ok: true }),
        )(request);
        expect(writeResponse.status).toBe(404);

        const meResponse = await handleAuthMe(request);
        await expect(meResponse.json()).resolves.toMatchObject({
            identity: {
                accessMode: "read-only",
                type: "authenticated",
                username: "admin",
            },
        });
    });

    it("does not validate auth details only when auth is disabled", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-only
auth:
  enabled: false
  mode: broken
  localUsers: []
`);
        const { getAuthConfig } = await importAuth(configFile);

        await expect(getAuthConfig()).resolves.toMatchObject({
            mode: "broken",
            localUsers: [],
        });
    });

    it("rejects anonymous read-write configuration", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-write
auth:
  enabled: false
`);
        const { publicAuthConfig } = await importAuth(configFile);

        await expect(publicAuthConfig()).rejects.toThrow(
            /auth\.enabled.*read-only/i,
        );
    });

    it("does not support auth.enable as an alias", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: read-only
auth:
  enable: false
`);
        const { publicAuthConfig } = await importAuth(configFile);

        await expect(publicAuthConfig()).resolves.toMatchObject({
            accessMode: "read-only",
            authRequired: true,
            mode: "local",
        });
    });

    it("rejects unsupported access mode aliases", async () => {
        const configFile = await writeAuthConfig(`
access:
  mode: view-only
`);
        const { publicAuthConfig } = await importAuth(configFile);

        await expect(publicAuthConfig()).rejects.toThrow(
            /read-only.*read-write/i,
        );
    });

    it("rejects invalid local user and SSO mapping access modes", async () => {
        const localConfigFile = await writeAuthConfig(`
auth:
  mode: local
  jwt:
    secret: test-secret
  users:
    - username: admin
      passwordHash: "${adminHash}"
      accessMode: admin
`);
        const { getAuthConfig } = await importAuth(localConfigFile);
        await expect(getAuthConfig()).rejects.toThrow(
            /read-only.*read-write/i,
        );

        const ssoConfigFile = await writeAuthConfig(`
auth:
  mode: local-sso
  jwt:
    secret: test-secret
  users:
    - username: admin
      passwordHash: "${adminHash}"
      accessMode: read-write
  sso:
    issuer: http://localhost:8080/realms/adak8s
    clientId: squidflow-backend
    groupMappings:
      - match: adak8s-admins
        accessMode: admin
`);
        const { getAuthConfig: getSsoAuthConfig } =
            await importAuth(ssoConfigFile);
        await expect(getSsoAuthConfig()).rejects.toThrow(
            /read-only.*read-write/i,
        );
    });

    it("rejects deprecated tenant and admin mapping fields", async () => {
        const localConfigFile = await writeAuthConfig(`
auth:
  mode: local
  jwt:
    secret: test-secret
  users:
    - username: admin
      passwordHash: "${adminHash}"
      tenants: ["adak8s"]
`);
        const { getAuthConfig } = await importAuth(localConfigFile);
        await expect(getAuthConfig()).rejects.toThrow(/access_mode/i);

        const ssoConfigFile = await writeAuthConfig(`
auth:
  mode: local-sso
  jwt:
    secret: test-secret
  users:
    - username: admin
      passwordHash: "${adminHash}"
      accessMode: read-write
  sso:
    issuer: http://localhost:8080/realms/adak8s
    clientId: squidflow-backend
    groupMappings:
      - match: adak8s-admins
        add_tenants: ["*"]
        is_admin: true
`);
        const { getAuthConfig: getSsoAuthConfig } =
            await importAuth(ssoConfigFile);
        await expect(getSsoAuthConfig()).rejects.toThrow(/access_mode/i);
    });

    it("maps authenticated requests to read-write", async () => {
        const { handleAuthMe, resolveIdentity, signAuthToken, withWrite } =
            await importAuth();
        const signed = await signAuthToken({
            accessMode: "read-write",
            username: "admin",
        });
        const request = new Request("http://dashboard.local/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${signed.token}` },
        });

        await expect(resolveIdentity(request)).resolves.toMatchObject({
            accessMode: "read-write",
            type: "authenticated",
            username: "admin",
        });

        const meResponse = await handleAuthMe(request);
        await expect(meResponse.json()).resolves.toMatchObject({
            identity: {
                accessMode: "read-write",
                type: "authenticated",
                username: "admin",
            },
        });

        const writeResponse = await withWrite(() =>
            Response.json({ ok: true }),
        )(request);
        expect(writeResponse.status).toBe(200);
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
