'use client'

import { cn } from "@/lib/utils"
import { navItems } from "../../../../constants"
import { DashboardNav } from "@/components/navigation-menu"
import Image from "next/image"
import volcanoLogo from "@/assets/volcano-icon-color.svg"

export default function Sidebar({className} : {className?: string}) {
    return (
        <aside className={cn(`relative h-screen w-[240px] bg-neutral-100 max-w-full border-r bg-card flex-none `, className)}>
            <div className="p-5 pt-10 flex items-center">
                <Image src={volcanoLogo || "/placeholder.svg"} alt="Volcano Logo" width={32} height={32} />
                <span className="text-xl ml-2 font-semibold text-primary">Volcano</span>
            </div>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mt-3 space-y-1">
                        <DashboardNav navItems={navItems} className="hidden md:flex md:col-span-3"/>
                    </div>
                </div>
            </div>
        </aside>
    )
}
