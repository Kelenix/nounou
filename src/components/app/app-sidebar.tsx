"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageCircle,
  Bell,
  User,
  PlusCircle,
  Briefcase,
  Heart,
  Settings,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/lib/supabase/database.types";

type Item = { href: string; label: string; icon: typeof Search; exact?: boolean; badge?: number };

export function AppSidebar({ profile, unread, messagesUnread = 0 }: { profile: ProfileRow; unread: number; messagesUnread?: number }) {
  const pathname = usePathname();
  const t = useTranslations();

  const items: Item[] = [
    { href: "/app", label: t("appNav.dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/app/recherche", label: profile.role === "employer" ? t("appNav.searchNanny") : t("appNav.offers"), icon: Search },
    ...(profile.role === "employer"
      ? ([
          { href: "/app/offres", label: t("appNav.myOffers"), icon: Briefcase },
          { href: "/app/favoris", label: t("appNav.favorites"), icon: Heart },
        ] as Item[])
      : []),
    { href: "/app/candidatures", label: profile.role === "employer" ? t("appNav.applicationsReceived") : t("appNav.myApplications"), icon: FileText },
    { href: "/app/messages", label: t("appNav.messages"), icon: MessageCircle, badge: messagesUnread },
    { href: "/app/notifications", label: t("appNav.notifications"), icon: Bell, badge: unread },
    { href: "/app/profil", label: t("appNav.profile"), icon: User },
    { href: "/app/parametres", label: t("appNav.settings"), icon: Settings },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="px-5 py-5">
        <Logo height={36} />
      </div>

      {profile.role === "employer" && (
        <div className="px-4 pb-2">
          <Button asChild className="w-full shadow-sm">
            <Link href="/app/offres/nouvelle">
              <PlusCircle className="size-4" /> {t("appNav.postOffer")}
            </Link>
          </Button>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5 transition-transform group-hover:scale-110", active && "text-primary")} />
              <span className="flex-1">{it.label}</span>
              {it.badge ? (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
                  {it.badge > 9 ? "9+" : it.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="mb-3 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Globe className="size-5" /> {t("appNav.siteHome")}
        </Link>
        <div className="mb-3 px-1">
          <LanguageSwitcher />
        </div>
        <Link
          href="/app/profil"
          className="mb-3 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary"
        >
          <Avatar src={profile.photo_url} nom={profile.nom} prenom={profile.prenom} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {`${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || t("appNav.myProfile")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.role === "employer" ? t("roles.employer") : t("roles.candidate")}
            </p>
          </div>
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
