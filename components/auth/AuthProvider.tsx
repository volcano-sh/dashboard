"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
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

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authConfig, setAuthConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);

    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

    const logout = useCallback(() => {
        clearStoredToken();
        setToken("");
        setUser(null);
        router.replace("/login");
    }, [router]);

    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use((config) => {
            const nextToken = getStoredToken();
            if (nextToken) {
                config.headers.Authorization = `Bearer ${nextToken}`;
            }
            return config;
        });
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error?.response?.status === 401) {
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
            try {
                const configResponse = await axios.get(
                    `${API_BASE}/auth/config`,
                );
                if (disposed) return;
                setAuthConfig(configResponse.data);
                const storedToken = getStoredToken();
                setToken(storedToken);
                if (storedToken) {
                    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
                        headers: { Authorization: `Bearer ${storedToken}` },
                    });
                    if (disposed) return;
                    setUser(meResponse.data?.user || null);
                } else if (!isPublicPath) {
                    router.replace("/login");
                }
            } catch {
                clearStoredToken();
                if (!disposed && !isPublicPath) {
                    router.replace("/login");
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
            setUser(response.data?.user || null);
            router.replace("/dashboard");
        },
        [router],
    );

    const value = useMemo(
        () => ({
            authConfig,
            loading,
            loginWithToken,
            logout,
            token,
            user,
        }),
        [authConfig, loading, loginWithToken, logout, token, user],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
