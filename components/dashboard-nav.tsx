"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Key, Webhook, FileText, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const routes = [
  {
    label: "Overview",
    icon: Home,
    href: "/dashboard" as const,
  },
  {
    label: "API Keys",
    icon: Key,
    href: "/dashboard/api-keys" as const,
  },
  {
    label: "Endpoints",
    icon: Webhook,
    href: "/dashboard/endpoints" as const,
  },
  {
    label: "Webhook Logs",
    icon: FileText,
    href: "/dashboard/webhooks" as const,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings" as const,
  },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2 px-2 py-4">
      {routes.map((route) => {
        const isActive = pathname === route.href;
        const Icon = route.icon;

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent" : "transparent"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
