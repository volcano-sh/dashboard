import { redirect } from "next/navigation";
import SsoCompletePageContent from "../../../components/auth/SsoCompletePageContent";
import { isAuthEnabled } from "../../../lib/server/auth";

export default async function SsoCompletePage() {
    if (!(await isAuthEnabled())) {
        redirect("/dashboard");
    }

    return <SsoCompletePageContent />;
}
