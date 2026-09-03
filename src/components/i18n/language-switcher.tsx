"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/i18n/locale-actions";
import { cn } from "@/lib/utils";

/**
 * Bascule FR/EN. Mémorise la langue (cookie) puis rafraîchit les Server Components.
 * - Mobile (< sm) : bouton compact « globe + langue » qui alterne entre les deux langues.
 * - Desktop (≥ sm) : pastille à deux segments FR / EN.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  const other = locales.find((l) => l !== locale) ?? locale;

  return (
    <>
      {/* Mobile : bascule compacte */}
      <button
        type="button"
        onClick={() => choose(other)}
        disabled={pending}
        aria-label={`Langue : ${locale.toUpperCase()}`}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1.5 text-xs font-bold uppercase text-foreground transition-colors hover:border-primary/40 sm:hidden",
          pending && "opacity-60",
          className,
        )}
      >
        <Globe className="size-3.5 text-muted-foreground" aria-hidden />
        {locale}
      </button>

      {/* Desktop : pastille à deux segments */}
      <div
        className={cn(
          "hidden shrink-0 items-center gap-0.5 rounded-full border border-border bg-background p-0.5 sm:inline-flex",
          pending && "opacity-60",
          className,
        )}
        role="group"
        aria-label="Langue"
      >
        <Globe className="mx-1 size-3.5 text-muted-foreground" aria-hidden />
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => choose(l)}
            disabled={pending}
            aria-pressed={l === locale}
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold uppercase transition-colors",
              l === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </>
  );
}
