import { Icons } from "@/components/icons";

export interface NavItem {
    title: string;
    icon?: keyof typeof Icons;
    href: string;
    disable?: boolean;
    label: string;
}


export const navItems: NavItem[] = [
    {
        title: "Dashboard",
        icon: "dashboard",
        href: `/`,
        label: "Dashboard",
        disable: false,
    },
    {
        title: "Jobs",
        icon: "Notepad",
        href: `/jobs`,
        label: "Jobs",
        disable: true
    },
    {
        title: "Queues",
        icon: "Cloud",
        href: `/queues`,
        label: "Queues",
        disable: true
    },
    {
        title: "Pods",
        icon: "Waypoint",
        href: `/pods`,
        label: "Pods",
        disable: true
    },
]
