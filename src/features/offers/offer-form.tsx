"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { SERVICE_OPTIONS, VILLES_CI, COMMUNES_ABIDJAN } from "@/lib/constants";
import { offerSchema } from "@/features/offers/schemas";
import type { ServiceType } from "@/lib/supabase/database.types";

export function OfferForm({ employerId }: { employerId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [titre, setTitre] = useState("");
  const [service, setService] = useState<ServiceType>("garde_enfants");
  const [ville, setVille] = useState("Abidjan");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [description, setDescription] = useState("");
  const [horaires, setHoraires] = useState("");
  const [salaire, setSalaire] = useState("");
  const [experience, setExperience] = useState("");
  const [logee, setLogee] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = offerSchema.safeParse({
      titre,
      type_service: service,
      ville,
      commune,
      quartier,
      description,
      horaires,
      salaire: salaire ? Number(salaire) : NaN,
      experience_souhaitee: experience ? Number(experience) : NaN,
      logee,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setLoading(true);
    const { data, error: insErr } = await supabase
      .from("offers")
      .insert({
        employer_id: employerId,
        titre: titre.trim(),
        type_service: service,
        ville,
        commune: commune.trim() || null,
        quartier: quartier.trim() || null,
        description: description.trim() || null,
        horaires: horaires.trim() || null,
        salaire: salaire ? Number(salaire) : null,
        experience_souhaitee: experience ? Number(experience) : null,
        logee,
        status: "active",
      })
      .select("id")
      .single();
    setLoading(false);
    if (insErr || !data) {
      setError("Publication impossible. Réessayez.");
      return;
    }
    toast("Offre publiée", "success");
    router.push(`/app/offres/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" type="button">
          <Link href="/app/offres"><ArrowLeft className="size-5" /></Link>
        </Button>
        <h1 className="text-lg font-extrabold">Publier une offre</h1>
      </div>

      <Field label="Titre de l'offre *">
        <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Nounou pour 2 enfants" />
      </Field>

      <Field label="Type de service *">
        <Select value={service} onChange={(e) => setService(e.target.value as ServiceType)}>
          {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ville *">
          <Select value={ville} onChange={(e) => setVille(e.target.value)}>
            {VILLES_CI.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Commune">
          {ville === "Abidjan" ? (
            <Select value={commune} onChange={(e) => setCommune(e.target.value)}>
              <option value="">—</option>
              {COMMUNES_ABIDJAN.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          ) : (
            <Input value={commune} onChange={(e) => setCommune(e.target.value)} placeholder="Commune" />
          )}
        </Field>
      </div>

      <Field label="Quartier">
        <Input value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Optionnel" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Salaire (FCFA)">
          <Input type="number" inputMode="numeric" min={0} value={salaire} onChange={(e) => setSalaire(e.target.value)} placeholder="Optionnel" />
        </Field>
        <Field label="Expérience souhaitée (ans)">
          <Input type="number" inputMode="numeric" min={0} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Optionnel" />
        </Field>
      </div>

      <Field label="Horaires">
        <Input value={horaires} onChange={(e) => setHoraires(e.target.value)} placeholder="Ex. 8h-17h, lun-ven" />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={logee} onChange={(e) => setLogee(e.target.checked)} className="size-4 accent-primary" />
        Personne logée sur place
      </label>

      <Field label="Description">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez le poste, les tâches, les conditions…" />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : "Publier l'offre"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
