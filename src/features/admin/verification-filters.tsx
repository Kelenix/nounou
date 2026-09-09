"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/** Filtres de la file de vérifications : date d'inscription + tri (mêmes réglages que la page Utilisateurs). */
export function VerificationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tr = useTranslations();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  const period = params.get("period") ?? "";
  const sort = params.get("sort") ?? "";
  const activeCount = [period, sort].filter(Boolean).length;

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
      <Select value={period} onChange={(e) => setParam("period", e.target.value)}>
        <option value="">{tr("admin.allPeriods")}</option>
        <option value="today">{tr("admin.periodToday")}</option>
        <option value="7d">{tr("admin.period7d")}</option>
        <option value="30d">{tr("admin.period30d")}</option>
      </Select>
      <Select value={sort} onChange={(e) => setParam("sort", e.target.value)}>
        <option value="">{tr("admin.sortRecent")}</option>
        <option value="old">{tr("admin.sortOld")}</option>
      </Select>
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)} className="text-muted-foreground sm:col-span-2">
          <X className="size-4" /> {tr("admin.resetFilters")}
        </Button>
      )}
    </div>
  );
}
