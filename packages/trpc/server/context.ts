export const createTrpcContext = async () => {
    return {
        session: null,
    };
};

export type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>>;
