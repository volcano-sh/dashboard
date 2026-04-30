"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE } from "../../lib/client/dashboard-api";
import {
    clearStoredToken,
    getStoredToken,
    storeToken,
} from "../../lib/client/auth-token";

const AuthContext = createContext(null);
const publicPaths = ["/login", "/login/sso-complete"];
const accessModeCanWrite = (accessMode) => accessMode === "read-write";
const readOnlyIdentity = {
    accessMode: "read-only",
    type: "read-only",
    username: "read-only",
};

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authConfig, setAuthConfig] = useState(null);
    const [identity, setIdentity] = useState(null);
    const [authError, setAuthError] = useState("");
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);
    const authConfigRef = useRef(null);

    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

    useEffect(() => {
        authConfigRef.current = authConfig;
    }, [authConfig]);

    const logout = useCallback(async () => {
        try {
            await axios.post(`${API_BASE}/auth/logout`);
        } catch {
            // Local token cleanup is the source of truth for this UI logout.
        } finally {
            clearStoredToken();
            setToken("");
            setIdentity(null);
            setAuthError("");
            setUser(null);
            router.replace("/login");
        }
    }, [router]);

    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use((config) => {
            const nextToken = getStoredToken();
            const readOnlyMode =
                authConfigRef.current?.accessMode === "read-only";
            if (nextToken && !readOnlyMode) {
                config.headers.Authorization = `Bearer ${nextToken}`;
            }
            return config;
        });
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const requestUrl = String(error?.config?.url || "");
                if (
                    error?.response?.status === 401 &&
                    !requestUrl.endsWith(`${API_BASE}/auth/me`) &&
                    authConfigRef.current?.accessMode !== "read-only"
                ) {
                    clearStoredToken();
                    if (!window.location.pathname.startsWith("/login")) {
                        window.location.assign("/login");
                    }
                }
                return Promise.reject(error);
            },
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    useEffect(() => {
        let disposed = false;

        const bootstrap = async () => {
            setLoading(true);
            setAuthError("");
            try {
                const configResponse = await axios.get(
                    `${API_BASE}/auth/config`,
                );
                if (disposed) return;
                setAuthConfig(configResponse.data);
                authConfigRef.current = configResponse.data;
                const readOnlyMode =
                    configResponse.data?.accessMode === "read-only";
                if (readOnlyMode) {
                    clearStoredToken();
                    setToken("");
                    setIdentity(readOnlyIdentity);
                    setUser(null);
                    return;
                }

                const storedToken = getStoredToken();
                setToken(storedToken);
                if (storedToken) {
                    let meResponse;
                    try {
                        meResponse = await axios.get(`${API_BASE}/auth/me`, {
                            headers: { Authorization: `Bearer ${storedToken}` },
                        });
                    } catch (meError) {
                        clearStoredToken();
                        setToken("");
                        throw meError;
                    }
                    if (disposed) return;
                    setIdentity(meResponse.data?.identity || null);
                    setUser(meResponse.data?.user || null);
                } else if (!isPublicPath) {
                    router.replace("/login");
                }
            } catch {
                clearStoredToken();
                setAuthError("Failed to load dashboard access configuration.");
                if (!disposed && !isPublicPath) {
                    setIdentity(null);
                    setToken("");
                    setUser(null);
                }
            } finally {
                if (!disposed) setLoading(false);
            }
        };

        bootstrap();
        return () => {
            disposed = true;
        };
    }, [isPublicPath, router]);

    const loginWithToken = useCallback(
        async (nextToken, remember = false) => {
            storeToken(nextToken, remember);
            setToken(nextToken);
            const response = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${nextToken}` },
            });
            setIdentity(response.data?.identity || null);
            setUser(response.data?.user || null);
            router.replace("/dashboard");
        },
        [router],
    );

    const value = useMemo(
        () => {
            const accessMode =
                identity?.accessMode ||
                user?.accessMode ||
                authConfig?.accessMode ||
                "";
            const canWrite = accessModeCanWrite(accessMode);
            return {
                accessMode,
                authConfig,
                authError,
                canRead: Boolean(accessMode),
                canWrite,
                identity,
                isReadOnly: accessMode === "read-only",
                loading,
                loginWithToken,
                logout,
                token,
                user,
            };
        },
        [
            authConfig,
            authError,
            identity,
            loading,
            loginWithToken,
            logout,
            token,
            user,
        ],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
