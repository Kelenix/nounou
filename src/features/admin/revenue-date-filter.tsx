"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Date locale → « AAAA-MM-JJ » (sans décalage de fuseau, contrairement à toISOString). */
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type PresetKey = "all" | "month" | "d30" | "d90";

/**
 * Filtre de période pour la page Revenus. Pousse `?from=&to=` dans l'URL ;
 * la page (server component, force-dynamic) recalcule les chiffres pour la période.
 */
export function RevenueDateFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const t = useTranslations();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  function apply(nextFrom: string, nextTo: string) {
    setLocalFrom(nextFrom);
    setLocalTo(nextTo);
    const params = new URLSearchParams();
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    const qs = params.toString();
    router.push(qs ? `/admin/revenus?${qs}` : "/admin/revenus");
  }

  function preset(key: PresetKey) {
    if (key === "all") return apply("", "");
    const today = new Date();
    const start = new Date();
    if (key === "month") start.setDate(1);
    if (key === "d30") start.setDate(today.getDate() - 29);
    if (key === "d90") start.setDate(today.getDate() - 89);
    apply(toYMD(start), toYMD(today));
  }

  // Quel raccourci correspond à la sélection courante (pour le surlignage).
  const active: PresetKey | null = (() => {
    if (!localFrom && !localTo) return "all";
    const today = toYMD(new Date());
    if (localTo !== today) return null;
    const s = new Date();
    const month = new Date();
    month.setDate(1);
    if (localFrom === toYMD(month)) return "month";
    s.setDate(new Date().getDate() - 29);
    if (localFrom === toYMD(s)) return "d30";
    s.setDate(new Date().getDate() - 89);
    if (localFrom === toYMD(s)) return "d90";
    return null;
  })();

  const presets: { key: PresetKey; label: string }[] = [
    { key: "all", label: t("revenus.periodAll") },
    { key: "month", label: t("revenus.periodMonth") },
    { key: "d30", label: t("revenus.period30") },
    { key: "d90", label: t("revenus.period90") },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => preset(p.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              active === p.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("revenus.dateFrom")}
          <Input
            type="date"
            value={localFrom}
            max={localTo || undefined}
            onChange={(e) => apply(e.target.value, localTo)}
            className="h-9 w-[9.5rem] text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("revenus.dateTo")}
          <Input
            type="date"
            value={localTo}
            min={localFrom || undefined}
            onChange={(e) => apply(localFrom, e.target.value)}
            className="h-9 w-[9.5rem] text-sm"
          />
        </label>
        {(localFrom || localTo) && (
          <Button variant="ghost" size="sm" onClick={() => preset("all")} title={t("revenus.periodReset")}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      <span className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
        <CalendarDays className="size-3.5" />
        {t("revenus.periodHint")}
      </span>
    </div>
  );
}
