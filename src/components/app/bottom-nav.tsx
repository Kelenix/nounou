"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Search, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ messagesUnread = 0 }: { messagesUnread?: number }) {
  const pathname = usePathname();
  const t = useTranslations();

  const TABS = [
    { href: "/app", label: t("appNav.home"), icon: Home, exact: true, badge: 0 },
    { href: "/app/recherche", label: t("appNav.search"), icon: Search, badge: 0 },
    { href: "/app/messages", label: t("appNav.messages"), icon: MessageCircle, badge: messagesUnread },
    { href: "/app/profil", label: t("appNav.profile"), icon: User, badge: 0 },
  ];

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <Icon className={cn("size-5", active && "fill-primary-soft")} />
                {tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-tight text-destructive-foreground">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
