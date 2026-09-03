"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SERVICE_OPTIONS, VILLES_CI } from "@/lib/constants";

/** Barre de recherche du hero : service + ville → /nounous. */
export function CatalogSearchBar() {
  const router = useRouter();
  const t = useTranslations();
  const [service, setService] = useState("");
  const [ville, setVille] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (service) params.set("service", service);
    if (ville) params.set("ville", ville);
    router.push(`/nounous${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-3xl border border-border bg-white/90 p-2 shadow-xl shadow-primary/5 backdrop-blur sm:flex-row"
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Select value={service} onChange={(e) => setService(e.target.value)} className="border-0 pl-9 shadow-none focus-visible:ring-0">
          <option value="">{t("catalog.servicePlaceholder")}</option>
          {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(`services.${o.value}`)}</option>)}
        </Select>
      </div>
      <div className="relative min-w-0 flex-1 sm:border-l sm:border-border">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Select value={ville} onChange={(e) => setVille(e.target.value)} className="border-0 pl-9 shadow-none focus-visible:ring-0">
          <option value="">{t("catalog.cityPlaceholder")}</option>
          {VILLES_CI.map((v) => <option key={v} value={v}>{v}</option>)}
        </Select>
      </div>
      <Button type="submit" size="lg" className="sm:px-8">
        <Search className="size-5" /> {t("catalog.search")}
      </Button>
    </form>
  );
}
