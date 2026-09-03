import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getCurrentProfile } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const t = await getTranslations();
  const espaceHref = profile?.role === "admin" ? "/admin" : "/app";

  const nav = [
    { href: "/nounous", label: t("nav.nounous") },
    { href: "/offres", label: t("nav.offres") },
    { href: "/comment-ca-marche", label: t("nav.howItWorks") },
    { href: "/tarifs", label: t("nav.pricing") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Logo priority />
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          {profile ? (
            <Button asChild size="sm">
              <Link href={espaceHref}>
                <LayoutDashboard className="size-4" /> {t("common.myAccount")}
              </Link>
            </Button>
          ) : (
            <>
              {/* Mobile : icône seule pour économiser la largeur ; texte dès sm. */}
              <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3" aria-label={t("common.login")}>
                <Link href="/connexion">
                  <LogIn className="size-4 sm:hidden" />
                  <span className="hidden sm:inline">{t("common.login")}</span>
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">
                  <span className="sm:hidden">{t("common.registerShort")}</span>
                  <span className="hidden sm:inline">{t("common.register")}</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
