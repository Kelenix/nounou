"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { VILLES_CI } from "@/lib/constants";

export function UserFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  // Met à jour l'URL (en réinitialisant la page) pour un paramètre donné.
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  // Recherche débattue (400 ms).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => setParam("q", q.trim()), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const role = params.get("role") ?? "";
  const status = params.get("status") ?? "";
  const ville = params.get("ville") ?? "";
  const activeCount = [q, role, status, ville].filter(Boolean).length;

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un nom…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Select value={role} onChange={(e) => setParam("role", e.target.value)}>
        <option value="">Tous les rôles</option>
        <option value="candidate">Candidates</option>
        <option value="employer">Employeurs</option>
        <option value="admin">Admins</option>
      </Select>
      <Select value={status} onChange={(e) => setParam("status", e.target.value)}>
        <option value="">Tous les statuts</option>
        <option value="active">Actifs</option>
        <option value="suspended">Suspendus</option>
      </Select>
      <Select value={ville} onChange={(e) => setParam("ville", e.target.value)}>
        <option value="">Toutes les villes</option>
        {VILLES_CI.map((v) => <option key={v} value={v}>{v}</option>)}
      </Select>
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => { setQ(""); router.replace(pathname); }} className="text-muted-foreground lg:col-span-4">
          <X className="size-4" /> Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}
