export function DemoBanner() {
    if (process.env.NEXT_PUBLIC_DASHBOARD_DEMO_MODE !== "true") {
        return null;
    }

    return (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            Preview mode — demo data only, not connected to a live cluster.
            Create, edit, and delete actions are disabled.
        </div>
    );
}
