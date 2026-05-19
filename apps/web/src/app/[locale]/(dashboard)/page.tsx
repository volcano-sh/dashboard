import { DashboardUtils } from "@/components/(dashboard)/dashboard-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTranslations } from "next-intl/server";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <ScrollArea className="h-[calc(100dvh)]">
      <section className="container grid items-center gap-6 pb-6 pt-12">
        <div className="flex max-w-[980px] flex-col items-start gap-2 mx-auto">
          <h1 className="text-xl font-semibold text-purple text-center">
            {t("title")}
          </h1>
        </div>
      </section>
      <hr className="max-w-x" />
      <DashboardUtils />
    </ScrollArea>
  );
}
