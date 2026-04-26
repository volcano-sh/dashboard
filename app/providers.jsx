"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { useState } from "react";
import { theme } from "../lib/theme";

export default function Providers({ children }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        staleTime: 15000,
                    },
                },
            }),
    );

    return (
        <AppRouterCacheProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{children}</ThemeProvider>
            </QueryClientProvider>
        </AppRouterCacheProvider>
    );
}
