'use client'

import { cn } from "@/lib/utils"
import { NavItem } from "../../constants"
import Link from "next/link"
import { Icons } from "./icons"
import { usePathname } from "next/navigation"

export const DashboardNav = ({navItems, className} : {navItems: NavItem[], className?: string}) => {
    const pathName = usePathname()
    return (
        <div className={cn("pt-4", className)}>
            <div className="flex flex-col gap-1 left-0 top-0 w-full">
            {navItems.map(({title, icon, href, disable}) => {
                const Icon = Icons[icon!] || Icons["Notepad"];
                return (
                <Link
                    key={title}
                    href={href}
                    className={cn(
                        'flex group items-center text-sm gap-2 overflow-hidden rounded-md p-2 font-medium',
                        'text-black hover:bg-gray-100',
                        'outline-none focus-visible:ring-2 focus-visible:ring-black',
                        pathName === href && "bg-primary/90 text-white hover:bg-primary/80 active:text-white",
                        disable && 'cursor-not-allowed opacity-70'
                    )}
                    aria-current="page"
                >
                    <Icon className={cn(
                                    `size-4 text-black`,
                                    pathName ===href && "text-white",
                                )}  />
                            {title}
                </Link>
                )
            }
            )}
            </div>
        </div>
    )   
}   
