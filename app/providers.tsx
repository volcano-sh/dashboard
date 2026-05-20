"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useState } from "react";
import AuthProvider from "../components/auth/AuthProvider";
import { theme } from "../lib/theme";

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: (failureCount, error: any) => {
                            const status = error?.response?.status;
                            if (status === 401 || status === 403) {
                                return false;
                            }
                            return failureCount < 2;
                        },
                        staleTime: 15000,
                    },
                },
            }),
    );

    return (
        <AppRouterCacheProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </AppRouterCacheProvider>
    );
}
