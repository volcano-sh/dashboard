import DashboardShell from "../../components/DashboardShell";
import AuthGuard from "../../components/auth/AuthGuard";

export default function DashboardLayout({ children }) {
    return (
        <AuthGuard>
            <DashboardShell>{children}</DashboardShell>
        </AuthGuard>
    );
}
