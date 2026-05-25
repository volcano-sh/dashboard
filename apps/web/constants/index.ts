import { Icons } from "@/components/icons";

export interface NavItem {
  titleKey: keyof typeof navTitleKeys;
  icon?: keyof typeof Icons;
  href: string;
  disable?: boolean;
}

export const navTitleKeys = {
  dashboard: "dashboard",
  jobs: "jobs",
  queues: "queues",
  pods: "pods",
  podgroups: "podgroups",
} as const;

export const navItems: NavItem[] = [
  {
    titleKey: "dashboard",
    icon: "dashboard",
    href: "/",
    disable: false,
  },
  {
    titleKey: "jobs",
    icon: "notepad",
    href: "/jobs",
    disable: false,
  },
  {
    titleKey: "queues",
    icon: "cloud",
    href: "/queues",
    disable: false,
  },
  {
    titleKey: "pods",
    icon: "waypoint",
    href: "/pods",
    disable: false,
  },
  {
    titleKey: "podgroups",
    icon: "container",
    href: "/podgroups",
    disable: false,
  },
];
