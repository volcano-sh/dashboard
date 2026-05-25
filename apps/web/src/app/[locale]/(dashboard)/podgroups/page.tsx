import PodGroupManagement from "@/components/(dashboard)/podgroups/podgroup-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "podgroups" });
  return { title: t("title") };
}

export default function PodGroupsPage() {
  return <PodGroupManagement />;
}
