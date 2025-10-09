import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@volcano/trpc/server/router"

const handler = async (req: Request) => {
    return fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: () => ({ session: null })
    })
}

export { handler as GET, handler as POST }
