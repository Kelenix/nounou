"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SERVICE_OPTIONS, VILLES_CI, COMMUNES_ABIDJAN } from "@/lib/constants";

/** Filtres du catalogue public de prestataires, pilotés par l'URL. */
export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // revenir à la page 1 quand un filtre change
    router.replace(`${pathname}?${next.toString()}`);
  }

  const ville = params.get("ville") ?? "";
  const service = params.get("service") ?? "";
  const commune = params.get("commune") ?? "";
  const salaireMax = params.get("salaireMax") ?? "";
  const tempsPlein = params.get("tempsPlein") ?? "";
  const active = [ville, service, commune, salaireMax, tempsPlein].filter(Boolean).length;

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Filtres</h2>
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)} className="text-muted-foreground">
            <X className="size-4" /> Effacer
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Service</Label>
        <Select value={service} onChange={(e) => update("service", e.target.value)}>
          <option value="">Tous les services</option>
          {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Ville</Label>
        <Select value={ville} onChange={(e) => update("ville", e.target.value)}>
          <option value="">Toutes les villes</option>
          {VILLES_CI.map((v) => <option key={v} value={v}>{v}</option>)}
        </Select>
      </div>

      {ville === "Abidjan" && (
        <div className="space-y-1.5">
          <Label>Commune</Label>
          <Select value={commune} onChange={(e) => update("commune", e.target.value)}>
            <option value="">Toutes</option>
            {COMMUNES_ABIDJAN.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Budget max (FCFA/mois)</Label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={salaireMax}
          onChange={(e) => update("salaireMax", e.target.value)}
          placeholder="Ex. 80000"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Disponibilité</Label>
        <Select value={tempsPlein} onChange={(e) => update("tempsPlein", e.target.value)}>
          <option value="">Peu importe</option>
          <option value="true">Temps plein</option>
          <option value="false">Temps partiel</option>
        </Select>
      </div>
    </div>
  );
}
