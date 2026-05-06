import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getDashboardConfig } from "./config";

const oidcStates = new Map();
let cachedConfig;
let cachedDiscovery;

export const AccessModes = {
    READ_ONLY: "read-only",
    READ_WRITE: "read-write",
};

const accessModeRank = {
    [AccessModes.READ_ONLY]: 1,
    [AccessModes.READ_WRITE]: 2,
};

const AUTHENTICATED_DEFAULT_ACCESS_MODE = AccessModes.READ_ONLY;

class AuthorizationError extends Error {
    status: number;

    constructor(message, status = 401) {
        super(message);
        this.name = "AuthorizationError";
        this.status = status;
    }
}

const json = (body, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json", ...headers },
        status,
    });

const base64Url = (input) =>
    Buffer.from(input)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

const decodeBase64Url = (input) => {
    const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
    return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
};

const parseDurationSeconds = (value, fallbackSeconds) => {
    if (!value) return fallbackSeconds;
    if (typeof value === "number") return value;
    const match = String(value)
        .trim()
        .match(/^(\d+)([smhd])?$/i);
    if (!match) return fallbackSeconds;
    const amount = Number.parseInt(match[1], 10);
    const unit = (match[2] || "s").toLowerCase();
    const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] || 1;
    return amount * multiplier;
};

const safeUser = (user) => ({
    accessMode: user.accessMode || AUTHENTICATED_DEFAULT_ACCESS_MODE,
    displayName: user.displayName || user.username,
    email: user.email || "",
    provider: user.provider || "local",
    username: user.username,
});

const isBcryptHash = (hash) => String(hash || "").startsWith("$2");

const normalizeAccessModeValue = (
    value,
    fallback = AUTHENTICATED_DEFAULT_ACCESS_MODE,
) => {
    const mode = String(value || fallback)
        .trim()
        .toLowerCase();
    if (!Object.values(AccessModes).includes(mode)) {
        throw new Error('Access mode must be "read-only" or "read-write".');
    }
    return mode;
};

const capAccessMode = (requestedMode, ceilingMode) =>
    accessModeRank[requestedMode] > accessModeRank[ceilingMode]
        ? ceilingMode
        : requestedMode;

const unsupportedAccessMappingFields = (object, fields) =>
    fields.filter((field) => Object.prototype.hasOwnProperty.call(object, field));

const rejectUnsupportedAccessMappingFields = (object, fields) => {
    const unsupported = unsupportedAccessMappingFields(object || {}, fields);
    if (unsupported.length > 0) {
        throw new Error(
            `${unsupported.join(", ")} are not supported; use access_mode to configure read-only or read-write access.`,
        );
    }
};

export const getAccessMode = async () => {
    const dashboardConfig = await getDashboardConfig();
    return normalizeAccessModeValue(
        dashboardConfig.access?.mode,
        AccessModes.READ_WRITE,
    );
};

export const isAuthEnabled = async () => {
    const dashboardConfig = await getDashboardConfig();
    return dashboardConfig.auth?.enabled !== false;
};

const normalizeAuthConfig = (parsed: any = {}) => {
    const source = parsed.auth || parsed;
    const sso = source.sso || {};
    const localUsers = source.users || source.localUsers;
    const groupMappings = sso.groupMappings || sso.group_mappings;
    const jwt = {
        ...(source.jwt || {}),
        ...(source.salt ? { secret: source.salt } : {}),
    };

    return {
        ...source,
        jwt,
        localUsers: Array.isArray(localUsers)
            ? localUsers.map((user) => {
                  rejectUnsupportedAccessMappingFields(user, [
                      "isAdmin",
                      "is_admin",
                      "tenants",
                  ]);
                  return {
                      accessMode: user.accessMode || user.access_mode,
                      displayName:
                          user.displayName ||
                          user.display_name ||
                          user.username,
                      email: user.email || "",
                      passwordHash: user.passwordHash || user.password_hash,
                      username: user.username,
                  };
              })
            : localUsers,
        sso: {
            ...sso,
            clientId: sso.clientId || sso.client_id,
            clientSecret: sso.clientSecret || sso.client_secret,
            issuer: sso.issuer || sso.issuer_url,
            jwksCacheTtl: sso.jwksCacheTtl || sso.jwks_cache_ttl,
            providerName: sso.providerName || sso.provider_name,
            redirectUri: sso.redirectUri || sso.redirect_uri,
            groupMappings: Array.isArray(groupMappings)
                ? groupMappings.map((mapping) => {
                      rejectUnsupportedAccessMappingFields(mapping, [
                          "addTenants",
                          "add_tenants",
                          "isAdmin",
                          "is_admin",
                          "tenants",
                      ]);
                      return {
                          accessMode:
                              mapping.accessMode || mapping.access_mode,
                          match: mapping.match,
                      };
                  })
                : groupMappings,
        },
    };
};

const validateAuthAccessMappings = (config) => {
    for (const user of config.localUsers || []) {
        rejectUnsupportedAccessMappingFields(user, [
            "isAdmin",
            "is_admin",
            "tenants",
        ]);
        normalizeAccessModeValue(user.accessMode);
    }

    const groupMappings = config.sso?.groupMappings;
    if (groupMappings === undefined) return;
    if (!Array.isArray(groupMappings)) {
        throw new Error("sso.group_mappings must be a list.");
    }
    for (const mapping of groupMappings) {
        rejectUnsupportedAccessMappingFields(mapping, [
            "addTenants",
            "add_tenants",
            "isAdmin",
            "is_admin",
            "tenants",
        ]);
        if (!mapping.match) {
            throw new Error("Each SSO group mapping must provide match.");
        }
        if (!mapping.accessMode) {
            throw new Error(
                "Each SSO group mapping must provide access_mode.",
            );
        }
        normalizeAccessModeValue(mapping.accessMode);
    }
};

const effectiveAccessMode = async (requestedMode) => {
    const ceilingMode = await getAccessMode();
    const normalizedRequestedMode = normalizeAccessModeValue(requestedMode);
    return capAccessMode(normalizedRequestedMode, ceilingMode);
};

const accessModeForLocalUser = async (user) =>
    effectiveAccessMode(user?.accessMode || AUTHENTICATED_DEFAULT_ACCESS_MODE);

export const oidcAccessGroups = (claims: any = {}) => {
    const groups = new Set();
    const add = (value) => {
        if (Array.isArray(value)) value.forEach(add);
        else if (value) groups.add(String(value));
    };

    add(claims.groups);
    add(claims.roles);
    add(claims.realm_access?.roles);
    Object.values(claims.resource_access || {}).forEach((resource: any) => {
        add(resource?.roles);
    });

    return [...groups];
};

export const resolveSsoAccessMode = async (claims: any = {}) => {
    const config = await getAuthConfig();
    const groups = oidcAccessGroups(claims);
    const matchedMapping = (config.sso?.groupMappings || []).find((mapping) =>
        groups.includes(mapping.match),
    );
    return effectiveAccessMode(
        matchedMapping?.accessMode || AUTHENTICATED_DEFAULT_ACCESS_MODE,
    );
};

export const getAuthConfig = async () => {
    const dashboardConfig = await getDashboardConfig();
    if (cachedConfig) return cachedConfig;

    const config = normalizeAuthConfig(dashboardConfig);
    if (config.enabled === false) {
        return config;
    }

    if (!["local", "local-sso"].includes(config.mode)) {
        throw new Error('Auth mode must be "local" or "local-sso".');
    }
    if (!config.jwt?.secret) {
        throw new Error("Auth config must provide jwt.secret.");
    }
    if (!Array.isArray(config.localUsers) || config.localUsers.length === 0) {
        throw new Error("Auth config must provide at least one local user.");
    }
    for (const user of config.localUsers) {
        if (!user.username || !user.passwordHash) {
            throw new Error(
                "Each local user must provide username and passwordHash.",
            );
        }
        if (!isBcryptHash(user.passwordHash)) {
            throw new Error("Local user passwordHash must be a bcrypt hash.");
        }
    }
    validateAuthAccessMappings(config);
    if (config.mode === "local-sso") {
        if (!config.sso?.issuer || !config.sso?.clientId) {
            throw new Error(
                "local-sso mode requires sso.issuer and sso.clientId.",
            );
        }
    }

    cachedConfig = config;
    return cachedConfig;
};

export const publicAuthConfig = async () => {
    const accessMode = await getAccessMode();
    const authEnabled = await isAuthEnabled();
    if (!authEnabled) {
        return {
            accessMode,
            authRequired: false,
            canRead: true,
            canWrite: false,
            localEnabled: false,
            mode: "disabled",
            providerName: "SSO",
            ssoEnabled: false,
        };
    }

    const config = await getAuthConfig();
    return {
        accessMode,
        authRequired: true,
        canRead: false,
        canWrite: false,
        localEnabled: true,
        mode: config.mode,
        providerName: config.sso?.providerName || "SSO",
        ssoEnabled: config.mode === "local-sso",
    };
};

export const signAuthToken = async (user, remember = false) => {
    const config = await getAuthConfig();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = parseDurationSeconds(
        remember ? config.jwt.rememberExpiresIn : config.jwt.expiresIn,
        remember ? 30 * 86400 : 8 * 3600,
    );
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
        exp: now + expiresIn,
        iat: now,
        iss: config.jwt.issuer || "volcano-dashboard",
        sub: user.username,
        user: safeUser(user),
    };
    const encodedHeader = base64Url(JSON.stringify(header));
    const encodedPayload = base64Url(JSON.stringify(payload));
    const signature = crypto
        .createHmac("sha256", config.jwt.secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64url");

    return {
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        token: `${encodedHeader}.${encodedPayload}.${signature}`,
        user: payload.user,
    };
};

export const verifyAuthToken = async (token) => {
    const config = await getAuthConfig();
    const [encodedHeader, encodedPayload, signature] = String(
        token || "",
    ).split(".");
    if (!encodedHeader || !encodedPayload || !signature) {
        throw new Error("Missing or invalid token.");
    }
    const expected = crypto
        .createHmac("sha256", config.jwt.secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64url");
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        throw new Error("Invalid token signature.");
    }
    const payload = JSON.parse(
        decodeBase64Url(encodedPayload).toString("utf8"),
    );
    if (payload.iss !== (config.jwt.issuer || "volcano-dashboard")) {
        throw new Error("Invalid token issuer.");
    }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired.");
    }
    return payload;
};

export const bearerTokenFromRequest = (request) => {
    const header = request.headers.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1] || "";
};

export const requireAuth = async (request) => {
    const token = bearerTokenFromRequest(request);
    if (!token) {
        throw new Error("Missing bearer token.");
    }
    return verifyAuthToken(token);
};

const unauthorized = (message) => new AuthorizationError(message, 401);
const forbidden = (message) => new AuthorizationError(message, 403);
const notFound = (message) => new AuthorizationError(message, 404);

export const authorizationResponse = (error) =>
    json(
        {
            error:
                error.status === 404
                    ? "Not Found"
                    : error.status === 403
                      ? "Forbidden"
                      : "Unauthorized",
            message:
                error.message ||
                (error.status === 404
                    ? "Endpoint is not available."
                    : error.status === 403
                      ? "Permission denied."
                      : "Authentication required."),
        },
        error.status || 401,
    );

export const resolveIdentity = async (request) => {
    const accessMode = await getAccessMode();
    if (!(await isAuthEnabled())) {
        return {
            accessMode,
            type: "anonymous",
            user: null,
            username: "anonymous",
        };
    }

    const token = bearerTokenFromRequest(request);
    if (token) {
        const payload = await verifyAuthToken(token);
        const effectiveTokenAccessMode = await effectiveAccessMode(
            payload.user?.accessMode,
        );
        return {
            accessMode: effectiveTokenAccessMode,
            type: "authenticated",
            user: {
                ...payload.user,
                accessMode: effectiveTokenAccessMode,
            },
            username: payload.user?.username || payload.sub,
        };
    }

    throw unauthorized("Authentication required.");
};

export const requireAccessMode = async (
    request,
    requiredAccessMode = AccessModes.READ_ONLY,
) => {
    try {
        const identity = await resolveIdentity(request);
        if (
            accessModeRank[identity.accessMode] <
            accessModeRank[requiredAccessMode]
        ) {
            throw forbidden(`${requiredAccessMode} permission required.`);
        }
        return identity;
    } catch (error) {
        if (error instanceof AuthorizationError) {
            throw error;
        }
        throw unauthorized(error.message || "Authentication required.");
    }
};

export const requireWrite = (request) =>
    requireAccessMode(request, AccessModes.READ_WRITE);

export const withAccessMode =
    (requiredAccessMode, handler) => async (request, context) => {
        try {
            const accessMode = await getAccessMode();
            if (
                accessMode === AccessModes.READ_ONLY &&
                requiredAccessMode === AccessModes.READ_WRITE
            ) {
                throw notFound("Endpoint is not available in read-only mode.");
            }
            await requireAccessMode(request, requiredAccessMode);
            return handler(request, context);
        } catch (error) {
            return authorizationResponse(error);
        }
    };

export const withRead = (handler) =>
    withAccessMode(AccessModes.READ_ONLY, handler);
export const withWrite = (handler) =>
    withAccessMode(AccessModes.READ_WRITE, handler);

export const withAuth = (handler) => async (request, context) => {
    try {
        await requireAuth(request);
        return handler(request, context);
    } catch (error) {
        return json(
            {
                error: "Unauthorized",
                message: error.message || "Authentication required.",
            },
            401,
        );
    }
};

export const handleLocalLogin = async (request) => {
    try {
        if (!(await isAuthEnabled())) {
            return json(
                {
                    error: "Login disabled",
                    message:
                        "Login is disabled because authentication is disabled.",
                },
                404,
            );
        }
        const config = await getAuthConfig();
        const { password, remember, username } = await request.json();
        const user = config.localUsers.find(
            (entry) => entry.username === username,
        );
        if (
            !user ||
            !(await bcrypt.compare(password || "", user.passwordHash))
        ) {
            return json(
                {
                    error: "Login failed",
                    message: "Invalid username or password.",
                },
                401,
            );
        }
        const accessMode = await accessModeForLocalUser(user);
        return json(
            await signAuthToken(
                { ...user, accessMode, provider: "local" },
                remember,
            ),
        );
    } catch (error) {
        return json({ error: "Login failed", message: error.message }, 500);
    }
};

const oidcDiscovery = async () => {
    const config = await getAuthConfig();
    if (cachedDiscovery) return cachedDiscovery;
    const issuer = config.sso.issuer.replace(/\/$/, "");
    const response = await fetch(`${issuer}/.well-known/openid-configuration`);
    if (!response.ok) {
        throw new Error("Failed to load OIDC discovery document.");
    }
    cachedDiscovery = await response.json();
    return cachedDiscovery;
};

const callbackUrl = (request, config) => {
    if (config.sso?.redirectUri) {
        return config.sso.redirectUri;
    }

    const url = new URL(request.url);
    return `${url.origin}/sso/callback`;
};

export const handleSsoStart = async (request) => {
    try {
        if (!(await isAuthEnabled())) {
            return json({ error: "SSO disabled" }, 404);
        }
        const config = await getAuthConfig();
        if (config.mode !== "local-sso") {
            return json({ error: "SSO disabled" }, 404);
        }
        const discovery = await oidcDiscovery();
        const state = crypto.randomBytes(24).toString("base64url");
        const verifier = crypto.randomBytes(48).toString("base64url");
        const challenge = crypto
            .createHash("sha256")
            .update(verifier)
            .digest("base64url");
        oidcStates.set(state, {
            createdAt: Date.now(),
            verifier,
        });

        const redirect = new URL(discovery.authorization_endpoint);
        redirect.searchParams.set("client_id", config.sso.clientId);
        redirect.searchParams.set("code_challenge", challenge);
        redirect.searchParams.set("code_challenge_method", "S256");
        redirect.searchParams.set("redirect_uri", callbackUrl(request, config));
        redirect.searchParams.set("response_type", "code");
        redirect.searchParams.set(
            "scope",
            (config.sso.scopes || ["openid", "profile", "email"]).join(" "),
        );
        redirect.searchParams.set("state", state);

        return Response.redirect(redirect, 302);
    } catch (error) {
        return json({ error: "SSO start failed", message: error.message }, 500);
    }
};

const verifyOidcToken = async (idToken) => {
    const config = await getAuthConfig();
    const [encodedHeader, encodedPayload, signature] = idToken.split(".");
    const header = JSON.parse(decodeBase64Url(encodedHeader).toString("utf8"));
    const payload = JSON.parse(
        decodeBase64Url(encodedPayload).toString("utf8"),
    );
    const discovery = await oidcDiscovery();
    const jwksResponse = await fetch(discovery.jwks_uri);
    const jwks = await jwksResponse.json();
    const key = jwks.keys?.find((candidate) => candidate.kid === header.kid);
    if (!key) {
        throw new Error("OIDC signing key was not found.");
    }
    const publicKey = crypto.createPublicKey({ format: "jwk", key });
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    if (!verifier.verify(publicKey, decodeBase64Url(signature))) {
        throw new Error("OIDC token signature verification failed.");
    }
    if (payload.iss !== config.sso.issuer.replace(/\/$/, "")) {
        throw new Error("OIDC token issuer mismatch.");
    }
    if (
        payload.aud !== config.sso.clientId &&
        !payload.aud?.includes?.(config.sso.clientId)
    ) {
        throw new Error("OIDC token audience mismatch.");
    }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("OIDC token expired.");
    }
    return payload;
};

export const handleSsoCallback = async (request) => {
    try {
        if (!(await isAuthEnabled())) {
            return json({ error: "SSO disabled" }, 404);
        }
        const config = await getAuthConfig();
        if (config.mode !== "local-sso") {
            return json({ error: "SSO disabled" }, 404);
        }
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const stateEntry = oidcStates.get(state);
        oidcStates.delete(state);
        if (
            !code ||
            !stateEntry ||
            Date.now() - stateEntry.createdAt > 10 * 60_000
        ) {
            throw new Error("Invalid or expired SSO state.");
        }

        const discovery = await oidcDiscovery();
        const tokenResponse = await fetch(discovery.token_endpoint, {
            body: new URLSearchParams({
                client_id: config.sso.clientId,
                client_secret: config.sso.clientSecret || "",
                code,
                code_verifier: stateEntry.verifier,
                grant_type: "authorization_code",
                redirect_uri: callbackUrl(request, config),
            }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
        });
        if (!tokenResponse.ok) {
            throw new Error("OIDC token exchange failed.");
        }
        const tokenSet = await tokenResponse.json();
        const claims = await verifyOidcToken(tokenSet.id_token);
        const accessMode = await resolveSsoAccessMode(claims);
        const signed = await signAuthToken({
            accessMode,
            displayName:
                claims.name || claims.preferred_username || claims.email,
            email: claims.email || "",
            provider: "sso",
            username: claims.preferred_username || claims.email || claims.sub,
        });
        const redirect = new URL("/login/sso-complete", url.origin);
        redirect.hash = new URLSearchParams({
            expiresAt: signed.expiresAt,
            token: signed.token,
        }).toString();
        return Response.redirect(redirect, 302);
    } catch (error) {
        const url = new URL(request.url);
        const redirect = new URL("/login", url.origin);
        redirect.searchParams.set(
            "error",
            error.message || "SSO login failed.",
        );
        return Response.redirect(redirect, 302);
    }
};

export const handleAuthMe = async (request) => {
    try {
        const identity = await resolveIdentity(request);
        return json({
            identity: {
                accessMode: identity.accessMode,
                type: identity.type,
                username: identity.username,
            },
            user: identity.user,
        });
    } catch (error) {
        return authorizationResponse(error);
    }
};
