import Link from "next/link";
import { Bell, Hand, Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { ProfileRow } from "@/lib/supabase/database.types";

export async function AppHeader({
  profile,
  unread,
}: {
  profile: ProfileRow;
  unread: number;
}) {
  const t = await getTranslations();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("appNav.greeting")}</p>
          <p className="-mt-0.5 flex items-center gap-1 text-sm font-bold">
            <span className="truncate">{profile.prenom ?? t("appNav.welcome")}</span>
            <Hand className="size-3.5 shrink-0 text-primary" />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <LanguageSwitcher className="mr-0.5" />
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t("appNav.siteHome")}
          >
            <Home className="size-5" />
          </Link>
          <Link
            href="/app/notifications"
            className="relative flex size-9 items-center justify-center rounded-full hover:bg-accent"
            aria-label={t("appNav.notifications")}
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <SignOutButton iconOnly />
          <Link href="/app/profil" aria-label={t("appNav.myProfile")}>
            <Avatar
              src={profile.photo_url}
              nom={profile.nom}
              prenom={profile.prenom}
              className="size-9"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
