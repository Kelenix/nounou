"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown, Globe, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/lib/supabase/database.types";

/**
 * Menu utilisateur (coin haut-droit du dashboard candidate/employeur, desktop) :
 * regroupe l'identité, le profil, l'accueil du site, la langue et la déconnexion
 * — auparavant en pied de la barre latérale. Ferme au clic-extérieur ou Échap.
 */
export function AppUserMenu({ profile }: { profile: ProfileRow }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const name = `${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || t("appNav.myProfile");
  const roleLabel = profile.role === "employer" ? t("roles.employer") : t("roles.candidate");

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 transition-colors hover:bg-secondary"
      >
        <Avatar src={profile.photo_url} nom={profile.nom} prenom={profile.prenom} className="size-8" />
        <span className="text-left">
          <span className="block max-w-[160px] truncate text-sm font-semibold leading-tight">{name}</span>
          <span className="block text-xs leading-tight text-muted-foreground">{roleLabel}</span>
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-background shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-border p-3">
            <Avatar src={profile.photo_url} nom={profile.nom} prenom={profile.prenom} className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/app/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <User className="size-4" /> {t("appNav.profile")}
            </Link>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Globe className="size-4" /> {t("appNav.siteHome")}
            </Link>
          </div>

          <div className="flex items-center justify-center border-t border-border px-4 py-3">
            <LanguageSwitcher />
          </div>

          <div className="border-t border-border p-2">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
