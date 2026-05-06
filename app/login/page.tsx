import { redirect } from "next/navigation";
import LoginPageContent from "../../components/auth/LoginPageContent";
import { isAuthEnabled } from "../../lib/server/auth";

export default async function LoginPage() {
    if (!(await isAuthEnabled())) {
        redirect("/dashboard");
    }

    return <LoginPageContent />;
}
