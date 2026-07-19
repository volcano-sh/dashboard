import { TRPCError } from "@trpc/server";

export function isDemoMode(): boolean {
    return process.env.DASHBOARD_DEMO_MODE === "true";
}

export function assertDemoWritable(): void {
    if (isDemoMode()) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message:
                "Demo mode: create, update, and delete operations are disabled.",
        });
    }
}
