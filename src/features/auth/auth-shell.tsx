import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, BadgeCheck, Star } from "lucide-react";

/** Coque des pages d'authentification : logo/brand à gauche, formulaire à droite. */
export function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      {/* Panneau marque (desktop) */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary-soft via-emerald-50 to-emerald-100 p-12 lg:flex">
        <div className="pointer-events-none absolute -left-16 top-10 size-80 rounded-full bg-primary/10 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -right-10 bottom-10 size-80 rounded-full bg-emerald-300/20 blur-3xl animate-blob delay-300" />
        <Link href="/" className="relative">
          <Image src="/logo.png" alt="J'ai ma nounou" width={420} height={280} priority className="h-64 w-auto object-contain" />
        </Link>
        <p className="relative mt-8 max-w-md text-center text-2xl font-semibold leading-snug text-foreground/80">
          La plateforme de confiance pour trouver une aide à domicile en Côte d&apos;Ivoire.
        </p>
        <div className="relative mt-10 flex flex-col gap-4 text-lg text-foreground/70">
          <span className="inline-flex items-center gap-3"><BadgeCheck className="size-6 text-primary" /> Profils vérifiés par SMS</span>
          <span className="inline-flex items-center gap-3"><Star className="size-6 text-primary" /> Avis authentiques</span>
          <span className="inline-flex items-center gap-3"><ShieldCheck className="size-6 text-primary" /> Signalement en un geste</span>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-xl">
          {/* Logo compact sur mobile */}
          <Link href="/" className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="J'ai ma nounou" width={240} height={160} priority className="h-28 w-auto object-contain" />
          </Link>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5 sm:p-10">
            {children}
          </div>

          <div className="mt-6 text-center text-base text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}
