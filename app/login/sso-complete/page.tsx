import { redirect } from "next/navigation";
import SsoCompletePageContent from "../../../components/auth/SsoCompletePageContent";
import { isReadOnlyMode } from "../../../lib/server/auth";

export default async function SsoCompletePage() {
    if (await isReadOnlyMode()) {
        redirect("/dashboard");
    }

    return <SsoCompletePageContent />;
}
