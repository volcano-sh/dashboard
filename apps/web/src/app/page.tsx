import { DashboardUtils } from "@/components/(dashboard)/dashboard-utils";
import Sidebar from "@/components/(dashboard)/layout/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function Home() {
  return (
    <div className="flex">
    <Sidebar />
    <main className="w-full flex-1 overflow-hidden">
    <ScrollArea className="h-[calc(100dvh)]">
      <section className="container grid items-center gap-6 pb-6 pt-12">
        <div className="flex max-w-[980px] flex-col items-start gap-2 mx-auto">
          <h1 className="text-xl font-semibold text-purple text-center">
            Dashboard
          </h1>
        </div>
      </section>
      <hr className="max-w-x" />
      <DashboardUtils />
    </ScrollArea>
    </main>
  </div>
  );
}
