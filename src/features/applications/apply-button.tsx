"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { APPLICATION_STATUS_META } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

export function ApplyButton({
  offerId,
  candidateId,
  existingStatus,
  isActivePaid,
}: {
  offerId: string;
  candidateId: string;
  existingStatus: ApplicationStatus | null;
  isActivePaid: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (existingStatus) {
    const meta = APPLICATION_STATUS_META[existingStatus];
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4">
        <CheckCircle2 className="size-5 text-primary" />
        <span className="text-sm">
          Vous avez déjà postulé — statut :{" "}
          <span className="font-semibold">{meta.label}</span>
        </span>
      </div>
    );
  }

  if (!isActivePaid) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Activez votre profil pour pouvoir postuler.{" "}
        <a href="/app/paiement" className="font-semibold underline">Activer maintenant</a>
      </div>
    );
  }

  async function apply() {
    setLoading(true);
    const { error } = await supabase.from("applications").insert({
      offer_id: offerId,
      candidate_id: candidateId,
      message: message.trim() || null,
      status: "en_attente",
    });
    setLoading(false);
    if (error) {
      toast("Impossible de postuler. Réessayez.", "error");
      return;
    }
    toast("Candidature envoyée !", "success");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)}>
        <Send className="size-4" /> Postuler à cette offre
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message à l'employeur (optionnel)…"
      />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
          Annuler
        </Button>
        <Button className="flex-1" onClick={apply} disabled={loading}>
          {loading ? <Spinner className="text-primary-foreground" /> : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}
