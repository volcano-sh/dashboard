import ModelBoostersManagement from "@/components/(dashboard)/modelboosters/modelboosters-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "modelboosters" });
  return { title: t("title") };
}

export default function ModelBoostersPage() {
  return <ModelBoostersManagement />;
}
