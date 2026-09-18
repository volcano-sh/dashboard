import PodManagement from "@/components/(dashboard)/pods/pod-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "pods" });
  return { title: t("title") };
}

export default function PodsPage() {
  return <PodManagement />;
}
