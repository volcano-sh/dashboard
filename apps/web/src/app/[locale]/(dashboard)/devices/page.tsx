import ModelServingManagement from "@/components/(dashboard)/devices/modelserving-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "devices" });
  return { title: t("title") };
}

export default function DevicesPage() {
  return <ModelServingManagement />;
}
