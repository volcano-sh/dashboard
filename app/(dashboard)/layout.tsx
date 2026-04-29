import type { ReactNode } from "react";
import DashboardShell from "../../components/DashboardShell";
import AuthGuard from "../../components/auth/AuthGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <DashboardShell>{children}</DashboardShell>
        </AuthGuard>
    );
}
