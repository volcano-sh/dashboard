import QueueManagement from "@/components/(dashboard)/queues/queue-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "queues" });
  return { title: t("title") };
}

export default function QueuesPage() {
  return <QueueManagement />;
}
