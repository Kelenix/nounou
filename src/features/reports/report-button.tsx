"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { ReportMotif } from "@/lib/supabase/database.types";

const MOTIFS: { value: ReportMotif; label: string }[] = [
  { value: "fausse_identite", label: "Fausse identité" },
  { value: "arnaque", label: "Arnaque" },
  { value: "harcelement", label: "Harcèlement" },
  { value: "offre_frauduleuse", label: "Offre frauduleuse" },
  { value: "comportement", label: "Comportement déplacé" },
  { value: "conditions_differentes", label: "Conditions différentes de l'annonce" },
  { value: "autre", label: "Autre" },
];

export function ReportButton({
  reporterId,
  targetId,
}: {
  reporterId: string;
  targetId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState<ReportMotif>("comportement");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const { error } = await supabase.from("reports").insert({
      from_user: reporterId,
      target_user: targetId,
      motif,
      description: description.trim() || null,
      status: "ouvert",
    });
    setLoading(false);
    if (error) {
      toast("Signalement impossible. Réessayez.", "error");
      return;
    }
    toast("Signalement envoyé. Merci.", "success");
    setOpen(false);
    setDescription("");
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setOpen(true)}>
        <Flag className="size-4" /> Signaler cet utilisateur
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-destructive/30 bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Signaler cet utilisateur</p>
      <div className="space-y-1.5">
        <Label>Motif</Label>
        <Select value={motif} onChange={(e) => setMotif(e.target.value as ReportMotif)}>
          {MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Décrivez le problème (optionnel)…"
      />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
          Annuler
        </Button>
        <Button variant="destructive" className="flex-1" onClick={submit} disabled={loading}>
          {loading ? <Spinner className="text-destructive-foreground" /> : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}
