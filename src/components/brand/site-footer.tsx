import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            La confiance avant tout. Mise en relation entre familles et aides à
            domicile en Côte d&apos;Ivoire.
          </p>
        </div>
        <FooterCol
          title="Explorer"
          links={[
            { href: "/nounous", label: "Nounous" },
            { href: "/offres", label: "Offres d'emploi" },
            { href: "/comment-ca-marche", label: "Comment ça marche" },
            { href: "/tarifs", label: "Tarifs" },
          ]}
        />
        <FooterCol
          title="Entreprise"
          links={[
            { href: "/contact", label: "Contact" },
            { href: "/faq", label: "FAQ" },
            { href: "/cgu", label: "CGU" },
            { href: "/confidentialite", label: "Confidentialité" },
          ]}
        />
        <FooterCol
          title="Commencer"
          links={[
            { href: "/inscription?role=employer", label: "Chercher une nounou" },
            { href: "/inscription?role=candidate", label: "Devenir nounou" },
            { href: "/connexion", label: "Se connecter" },
          ]}
        />
      </div>
      <div className="border-t border-border py-4">
        <p className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} J&apos;ai ma nounou — Côte d&apos;Ivoire.
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
