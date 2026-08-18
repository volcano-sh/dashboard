import { getTranslations } from "next-intl/server";
import { ScrollArea } from "@/components/ui/scroll-area";
import NodesManagement from "@/components/(dashboard)/nodes/nodes-management";

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: "nodes" });
  return { title: t("title") };
}

export default async function NodesPage() {
  return (
    <ScrollArea className="h-[calc(100dvh)]">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <NodesManagement />
      </div>
    </ScrollArea>
  );
}
