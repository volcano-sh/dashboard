"use client";

import { cn } from "@/lib/utils";
import { navItems } from "../../../../constants";
import { DashboardNav } from "@/components/navigation-menu";
import Image from "next/image";
import volcanoLogo from "@/assets/volcano-icon-color.svg";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export default function Sidebar({ className }: { className?: string }) {
  const t = useTranslations("nav");

  return (
    <aside
      className={cn(
        "relative h-screen w-[240px] bg-neutral-100 max-w-full border-r bg-card flex-none flex flex-col",
        className
      )}
    >
      <div className="p-5 pt-10 flex items-center">
        <Image
          src={volcanoLogo || "/placeholder.svg"}
          alt={t("logoAlt")}
          width={32}
          height={32}
        />
        <span className="text-xl ms-2 font-semibold text-primary">
          {t("brand")}
        </span>
      </div>
      <div className="flex-1 space-y-4 py-4 overflow-y-auto">
        <div className="px-3 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav
              navItems={navItems}
              className="hidden md:flex md:col-span-3"
            />
          </div>
        </div>
      </div>
      <div className="p-3 border-t mt-auto">
        <LanguageSwitcher />
      </div>
    </aside>
  );
}
