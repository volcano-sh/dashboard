import { Icons } from "@/components/icons";

export interface NavItem {
    title: string;
    icon?: keyof typeof Icons;
    href: string;
    disable?: boolean;
}


export const navItems: NavItem[] = [
    {
        title: "Dashboard",
        icon: "dashboard",
        href: `/`,
        disable: false,
    },
    {
        title: "Jobs",
        icon: "notepad",
        href: `/jobs`,
        disable: false
    },
    {
        title: "Queues",
        icon: "cloud",
        href: `/queues`,
        disable: false
    },
    {
        title: "Pods",
        icon: "waypoint",
        href: `/pods`,
        disable: false
    },
    {
        title: "PodGroups",
        icon: "container",
        href: `/podgroups`,
        disable: false
    },
]
