"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Flag, Settings, UserCog } from "lucide-react";
import { canAccess } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/lib/supabase/database.types";

export function AdminBottomNav({ profile }: { profile: ProfileRow }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Tableau", icon: LayoutDashboard, exact: true, show: true },
    { href: "/admin/utilisateurs", label: "Users", icon: Users, show: canAccess(profile, "users") },
    { href: "/admin/offres", label: "Offres", icon: FileText, show: canAccess(profile, "offers") },
    { href: "/admin/signalements", label: "Alertes", icon: Flag, show: canAccess(profile, "reports") },
    { href: "/admin/parametres", label: "Réglages", icon: Settings, show: canAccess(profile, "settings") },
    { href: "/admin/administrateurs", label: "Admins", icon: UserCog, show: profile.is_super_admin },
  ]
    .filter((t) => t.show)
    .slice(0, 5);

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "fill-primary-soft")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
