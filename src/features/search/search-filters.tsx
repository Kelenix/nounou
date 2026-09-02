"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SERVICE_OPTIONS, VILLES_CI, COMMUNES_ABIDJAN } from "@/lib/constants";

/** Barre de filtres commune (offres ou candidates), pilotée par l'URL. */
export function SearchFilters({ role }: { role: "candidate" | "employer" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // tout changement de filtre revient à la page 1
    router.replace(`${pathname}?${next.toString()}`);
  }

  function reset() {
    router.replace(pathname);
  }

  const ville = params.get("ville") ?? "";
  const service = params.get("service") ?? "";
  const commune = params.get("commune") ?? "";
  const salaireMax = params.get("salaireMax") ?? "";
  const expMin = params.get("expMin") ?? "";
  const tempsPlein = params.get("tempsPlein") ?? "";
  const activeCount = [ville, service, commune, salaireMax, expMin, tempsPlein].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4"
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="size-4" /> Filtres
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{activeCount}</span>
          )}
        </span>
        <span className="text-sm text-primary">{open ? "Masquer" : "Afficher"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Select value={ville} onChange={(e) => update("ville", e.target.value)}>
                <option value="">Toutes</option>
                {VILLES_CI.map((v) => <option key={v} value={v}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select value={service} onChange={(e) => update("service", e.target.value)}>
                <option value="">Tous</option>
                {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>

          {role === "employer" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Commune</Label>
                <Select value={commune} onChange={(e) => update("commune", e.target.value)}>
                  <option value="">Toutes</option>
                  {COMMUNES_ABIDJAN.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expérience min. (ans)</Label>
                <Input type="number" inputMode="numeric" min={0} value={expMin} onChange={(e) => update("expMin", e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Disponibilité</Label>
                <Select value={tempsPlein} onChange={(e) => update("tempsPlein", e.target.value)}>
                  <option value="">Peu importe</option>
                  <option value="true">Temps plein</option>
                  <option value="false">Temps partiel</option>
                </Select>
              </div>
            </div>
          )}

          {role === "candidate" && (
            <div className="space-y-1.5">
              <Label>Salaire minimum (FCFA)</Label>
              <Input type="number" inputMode="numeric" min={0} value={salaireMax} onChange={(e) => update("salaireMax", e.target.value)} placeholder="Ex. 50000" />
            </div>
          )}

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={reset} className="w-full text-muted-foreground">
              <X className="size-4" /> Réinitialiser
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
