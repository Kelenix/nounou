import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";

export async function SiteFooter() {
  const t = await getTranslations();
  return (
    <footer className="border-t border-border bg-background">
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <FooterCol
          title={t("footer.explore")}
          links={[
            { href: "/nounous", label: t("nav.nounous") },
            { href: "/offres", label: t("nav.offresEmploi") },
            { href: "/comment-ca-marche", label: t("nav.howItWorks") },
            { href: "/tarifs", label: t("nav.pricing") },
          ]}
        />
        <FooterCol
          title={t("footer.company")}
          links={[
            { href: "/contact", label: t("nav.contact") },
            { href: "/faq", label: t("nav.faq") },
            { href: "/cgu", label: t("nav.cgu") },
            { href: "/confidentialite", label: t("nav.privacy") },
          ]}
        />
        <FooterCol
          title={t("footer.start")}
          links={[
            { href: "/inscription?role=employer", label: t("footer.findNanny") },
            { href: "/inscription?role=candidate", label: t("footer.becomeNanny") },
            { href: "/connexion", label: t("common.login") },
          ]}
        />
      </div>
      <div className="border-t border-border py-4">
        <p className="container text-center text-xs text-muted-foreground">
          {t("footer.rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
