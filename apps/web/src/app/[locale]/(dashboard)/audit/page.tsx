import AuditManagement from "@/components/(dashboard)/audit/audit-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "audit" });
  return { title: t("title") };
}

export default function AuditPage() {
  return <AuditManagement />;
}
