import ModelServingsManagement from "@/components/(dashboard)/modelservings/modelservings-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "modelservings" });
  return { title: t("title") };
}

export default function ModelServingsPage() {
  return <ModelServingsManagement />;
}
