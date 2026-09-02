import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pagination par liens (préserve les filtres passés dans `params`). */
export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams(params);
    if (p > 1) q.set("page", String(p));
    else q.delete("page");
    const qs = q.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5">
      <PageLink href={href(page - 1)} disabled={page <= 1} aria-label="Précédent">
        <ChevronLeft className="size-4" />
      </PageLink>

      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-muted-foreground">…</span>}
            <Link
              href={href(p)}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border text-sm font-semibold transition-colors",
                p === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40",
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}

      <PageLink href={href(page + 1)} disabled={page >= totalPages} aria-label="Suivant">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...rest
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AriaAttributes) {
  if (disabled) {
    return (
      <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground opacity-50" {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/40"
      {...rest}
    >
      {children}
    </Link>
  );
}
