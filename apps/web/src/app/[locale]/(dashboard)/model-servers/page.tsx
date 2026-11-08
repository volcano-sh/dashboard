import ModelServersManagement from "@/components/(dashboard)/modelservers/modelservers-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "modelservers" });
  return { title: t("title") };
}

export default function ModelServersPage() {
  return <ModelServersManagement />;
}
