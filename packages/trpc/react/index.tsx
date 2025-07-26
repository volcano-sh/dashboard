'use client';
import { useState } from 'react';
import { QueryClient, QueryClientConfig, QueryClientProvider } from "@tanstack/react-query"
import { createTRPCReact, httpBatchLink, httpLink, splitLink } from "@trpc/react-query"
import  type { AppRouter } from "../server/router"
import SuperJSON from "superjson"


export const trpc = createTRPCReact<AppRouter>({
    overrides:{
        useMutation:{
            async onSuccess(opts){
                await opts.originalFn();
                
            }
        }
    }
})


export interface TrpcProviderProps {
    children: React.ReactNode
}

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

//   const webAppUrl = NEXT_PUBLIC_WEBAPP_URL();

//   if (webAppUrl) {
//     return webAppUrl;
//   }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};


export function TrpcProvider({children}: TrpcProviderProps) {
    const [queryClient] = useState(
        () =>
          new QueryClient({
            defaultOptions: { queries: { staleTime: 5000 } },
          })
    );

    const [trpcClient] = useState(() =>
        trpc.createClient({
          transformer: SuperJSON,
    
          links: [
            splitLink({
                condition: (op) => op.context.skipBatch === true,
                true: httpLink({
                  url: `${getBaseUrl()}/api/trpc`,
                }),
                false: httpBatchLink({
                  url: `${getBaseUrl()}/api/trpc`,
                }),
              }),
          ],
        }),
      );
    
    return (
       <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
       </trpc.Provider>
    )
}