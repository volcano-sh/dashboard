import ModelRoutesManagement from "@/components/(dashboard)/modelroutes/modelroutes-management";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "modelroutes" });
  return { title: t("title") };
}

export default function ModelRoutesPage() {
  return <ModelRoutesManagement />;
}
