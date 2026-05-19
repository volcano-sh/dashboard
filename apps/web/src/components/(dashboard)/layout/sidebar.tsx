'use client'

import { cn } from "@/lib/utils"
import { navItems } from "../../../../constants"
import { DashboardNav } from "@/components/navigation-menu"
import Image from "next/image"
import volcanoLogo from "@/assets/volcano-icon-color.svg"
import { useTranslations } from "next-intl"

export default function Sidebar({ className }: { className?: string }) {
    const t = useTranslations("Sidebar");

    const translatedNavItems = navItems.map((item) => {
        // We match the english title (e.g. 'Dashboard') to the translation key (e.g. 'dashboard')
        const translationKey = item.title.charAt(0).toLowerCase() + item.title.slice(1);
        return {
            ...item,
            title: t(translationKey as any) || item.title
        };
    });

    return (
        <aside className={cn(`relative h-screen w-[240px] bg-neutral-100 max-w-full border-r bg-card flex-none `, className)}>
            <div className="p-5 pt-10 flex items-center">
                <Image src={volcanoLogo || "/placeholder.svg"} alt="Volcano Logo" width={32} height={32} />
                <span className="text-xl ml-2 font-semibold text-primary">Volcano</span>
            </div>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mt-3 space-y-1">
                        <DashboardNav navItems={translatedNavItems} className="hidden md:flex md:col-span-3" />
                    </div>
                </div>
            </div>
        </aside>
    )
}

