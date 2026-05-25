import JobsManagement from "@/components/(dashboard)/jobs/jobs-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "jobs" });
  return { title: t("title") };
}

export default function JobsPage() {
  return <JobsManagement />;
}
