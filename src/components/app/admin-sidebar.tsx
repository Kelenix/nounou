"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Users, FileText, Flag, Globe, ShieldCheck, Settings, UserCog, ScrollText } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { canAccess } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/lib/supabase/database.types";

export function AdminSidebar({ profile }: { profile: ProfileRow }) {
  const pathname = usePathname();
  const t = useTranslations();

  const ITEMS = [
    { href: "/admin", label: t("adminNav.dashboard"), icon: LayoutDashboard, exact: true, show: true },
    { href: "/admin/utilisateurs", label: t("adminNav.users"), icon: Users, show: canAccess(profile, "users") },
    { href: "/admin/offres", label: t("adminNav.offers"), icon: FileText, show: canAccess(profile, "offers") },
    { href: "/admin/signalements", label: t("adminNav.reports"), icon: Flag, show: canAccess(profile, "reports") },
    { href: "/admin/parametres", label: t("adminNav.settings"), icon: Settings, show: canAccess(profile, "settings") },
    { href: "/admin/administrateurs", label: t("adminNav.admins"), icon: UserCog, show: profile.is_super_admin },
    { href: "/admin/journal", label: t("adminNav.auditLog"), icon: ScrollText, show: profile.is_super_admin },
  ].filter((i) => i.show);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo height={36} href="/admin" />
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
          {profile.is_super_admin ? t("adminNav.superAdmin") : t("adminNav.staff")}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {ITEMS.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5 transition-transform group-hover:scale-110", active && "text-primary")} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="mb-3 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Globe className="size-5" /> {t("adminNav.siteHome")}
        </Link>
        <div className="mb-3 px-1">
          <LanguageSwitcher />
        </div>
        <Link
          href="/admin/profil/modifier"
          className="mb-3 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary"
          title={t("adminNav.editProfileTitle")}
        >
          <Avatar src={profile.photo_url} nom={profile.nom} prenom={profile.prenom} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {`${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || t("adminNav.adminFallback")}
            </p>
            <p className="inline-flex items-center gap-1 truncate text-xs text-primary">
              <ShieldCheck className="size-3" /> {profile.is_super_admin ? t("adminNav.superAdmin") : t("adminNav.staffMember")}
            </p>
          </div>
        </Link>
        <SignOutButton />
      </div>
    </aside>
  );
}
