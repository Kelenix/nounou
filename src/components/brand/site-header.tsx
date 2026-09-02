import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";

const NAV = [
  { href: "/nounous", label: "Nounous" },
  { href: "/offres", label: "Offres" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/tarifs", label: "Tarifs" },
];

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const espaceHref = profile?.role === "admin" ? "/admin" : "/app";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {profile ? (
            <Button asChild size="sm">
              <Link href={espaceHref}>
                <LayoutDashboard className="size-4" /> Mon espace
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/connexion">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
