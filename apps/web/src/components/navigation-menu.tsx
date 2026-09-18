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

  const localizedHref = (href: string) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`;

  return (
    <div className={cn("pt-4", className)}>
      <div className="flex flex-col gap-1 start-0 top-0 w-full">
        {navItems.map(({ titleKey, icon, href, disable }) => {
          const Icon = Icons[icon!] || Icons["notepad"];
          const isActive =
            href === "/"
              ? pathName === "/"
              : pathName === href || pathName.startsWith(`${href}/`);

          return (
            <NextLink
              key={titleKey}
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
          );
        })}
      </div>
    </div>
  );
};
