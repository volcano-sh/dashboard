import { redirect } from "next/navigation";
import LoginPageContent from "../../components/auth/LoginPageContent";
import { isReadOnlyMode } from "../../lib/server/auth";

export default async function LoginPage() {
    if (await isReadOnlyMode()) {
        redirect("/dashboard");
    }

    return <LoginPageContent />;
}
