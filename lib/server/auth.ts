import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { getDashboardConfig } from "./config";

const oidcStates = new Map();
let cachedConfig;
let cachedDiscovery;

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
    displayName: user.displayName || user.username,
    email: user.email || "",
    provider: user.provider || "local",
    username: user.username,
});

const normalizeAuthConfig = (parsed: any = {}) => {
    const source = parsed.auth || parsed;
    const sso = source.sso || {};
    const localUsers = source.users || source.localUsers;
    const jwt = {
        ...(source.jwt || {}),
        ...(source.salt ? { secret: source.salt } : {}),
    };

    return {
        ...source,
        jwt,
        localUsers: Array.isArray(localUsers)
            ? localUsers.map((user) => ({
                  displayName:
                      user.displayName || user.display_name || user.username,
                  email: user.email || "",
                  isAdmin: user.isAdmin ?? user.is_admin,
                  passwordHash: user.passwordHash || user.password_hash,
                  tenants: user.tenants || [],
                  username: user.username,
              }))
            : localUsers,
        sso: {
            ...sso,
            clientId: sso.clientId || sso.client_id,
            clientSecret: sso.clientSecret || sso.client_secret,
            issuer: sso.issuer || sso.issuer_url,
            jwksCacheTtl: sso.jwksCacheTtl || sso.jwks_cache_ttl,
            providerName: sso.providerName || sso.provider_name,
            redirectUri: sso.redirectUri || sso.redirect_uri,
        },
    };
};

export const getAuthConfig = async () => {
    if (cachedConfig) return cachedConfig;

    const dashboardConfig = await getDashboardConfig();
    const config = normalizeAuthConfig(dashboardConfig);
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
        if (!String(user.passwordHash).startsWith("$2")) {
            throw new Error("Local user passwordHash must be a bcrypt hash.");
        }
    }
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
    const config = await getAuthConfig();
    return {
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
        return json(
            await signAuthToken({ ...user, provider: "local" }, remember),
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

const callbackUrl = (request) => {
    const url = new URL(request.url);
    return `${url.origin}/api/v1/auth/sso/callback`;
};

export const handleSsoStart = async (request) => {
    try {
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
        redirect.searchParams.set("redirect_uri", callbackUrl(request));
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
                redirect_uri: callbackUrl(request),
            }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
        });
        if (!tokenResponse.ok) {
            throw new Error("OIDC token exchange failed.");
        }
        const tokenSet = await tokenResponse.json();
        const claims = await verifyOidcToken(tokenSet.id_token);
        const signed = await signAuthToken({
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
        const payload = await requireAuth(request);
        return json({ user: payload.user });
    } catch (error) {
        return json({ error: "Unauthorized", message: error.message }, 401);
    }
};
