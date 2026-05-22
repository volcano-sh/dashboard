import { createTRPCProxyClient, httpBatchLink, httpLink, splitLink } from '@trpc/client';
import SuperJSON from 'superjson';


import type { AppRouter } from '../server/router';
import { getBaseUrl } from '../react';

export const trpc = createTRPCProxyClient<AppRouter>({
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
});

export { TRPCClientError } from '@trpc/client';
