import Link from "next/link";
import { Bell, Hand, Home } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { ProfileRow } from "@/lib/supabase/database.types";

export function AppHeader({
  profile,
  unread,
}: {
  profile: ProfileRow;
  unread: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div>
          <p className="text-xs text-muted-foreground">Bonjour</p>
          <p className="-mt-0.5 flex items-center gap-1 text-sm font-bold">
            {profile.prenom ?? "Bienvenue"}
            <Hand className="size-3.5 text-primary" />
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Accueil du site"
          >
            <Home className="size-5" />
          </Link>
          <Link
            href="/app/notifications"
            className="relative flex size-10 items-center justify-center rounded-full hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <SignOutButton iconOnly />
          <Link href="/app/profil" aria-label="Mon profil">
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
