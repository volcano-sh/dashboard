export const createTrpcContext = async (opts: any) => {
    return {
        session: null,
    };
};

export type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>>;
