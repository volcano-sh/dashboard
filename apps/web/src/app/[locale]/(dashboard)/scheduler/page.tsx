import SchedulerManagement from "@/components/(dashboard)/scheduler/scheduler-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "scheduler" });
  return { title: t("title") };
}

export default function SchedulerPage() {
  return <SchedulerManagement />;
}
