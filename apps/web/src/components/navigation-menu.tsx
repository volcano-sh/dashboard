"use client";

import { cn } from "@/lib/utils";
import { NavItem } from "../../constants";
import { Icons } from "./icons";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import NextLink from "next/link";

export const DashboardNav = ({
  navItems,
  className,
}: {
  navItems: NavItem[];
  className?: string;
}) => {
  const pathName = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav.items");
  const tSection = useTranslations("nav.sections");

  const localizedHref = (href: string) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`;

  return (
    <div className={cn("pt-4", className)}>
      <div className="flex flex-col gap-1 start-0 top-0 w-full">
        {navItems.map(({ titleKey, icon, href, disable, sectionKey }, index) => {
          const Icon = Icons[icon!] || Icons["notepad"];
          const isActive =
            href === "/"
              ? pathName === "/"
              : pathName === href || pathName.startsWith(`${href}/`);
          const prevSection = index > 0 ? navItems[index - 1]?.sectionKey : undefined;
          const showSection = Boolean(sectionKey) && sectionKey !== prevSection;

          return (
            <div key={titleKey}>
              {showSection && sectionKey && (
                <div className="px-2 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tSection(sectionKey)}
                </div>
              )}
            <NextLink
              href={localizedHref(href)}
              className={cn(
                "flex group items-center text-sm gap-2 overflow-hidden rounded-md p-2 font-medium",
                "text-black hover:bg-gray-100",
                "outline-none focus-visible:ring-2 focus-visible:ring-black",
                isActive &&
                  "bg-primary/90 text-white hover:bg-primary/80 active:text-white",
                disable && "cursor-not-allowed opacity-70"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-4 text-black",
                  isActive && "text-white"
                )}
              />
              {t(titleKey)}
            </NextLink>
            </div>
          );
        })}
      </div>
    </div>
  );
};
