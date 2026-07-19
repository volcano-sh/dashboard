export function useDemoMode(): boolean {
    return process.env.NEXT_PUBLIC_DASHBOARD_DEMO_MODE === "true";
}
