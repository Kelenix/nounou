"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Eye, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { APPLICATION_STATUS_META } from "@/lib/constants";
import type { ApplicationStatus, PublicProfileRow } from "@/lib/supabase/database.types";

export type EmployerApplication = {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  candidate: Pick<PublicProfileRow, "id" | "nom" | "prenom" | "photo_url" | "ville" | "commune"> | null;
};

export function EmployerApplicationItem({ application }: { application: EmployerApplication }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [loading, setLoading] = useState(false);
  const cand = application.candidate;

  async function setNewStatus(next: ApplicationStatus) {
    setLoading(true);
    const { error } = await supabase.from("applications").update({ status: next }).eq("id", application.id);
    setLoading(false);
    if (error) {
      toast("Action impossible.", "error");
      return;
    }
    setStatus(next);
    toast(
      next === "acceptee" ? "Candidature acceptée" : next === "refusee" ? "Candidature refusée" : "Mise à jour",
      "success",
    );
    router.refresh();
  }

  const meta = APPLICATION_STATUS_META[status];
  const decided = status === "acceptee" || status === "refusee";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar src={cand?.photo_url} nom={cand?.nom} prenom={cand?.prenom} className="size-12" />
        <div className="flex-1">
          <Link href={cand ? `/app/candidates/${cand.id}` : "#"} className="font-semibold hover:underline">
            {cand ? `${cand.prenom ?? ""} ${cand.nom ?? ""}`.trim() || "Candidate" : "Candidate"}
          </Link>
          {(cand?.commune || cand?.ville) && (
            <p className="text-xs text-muted-foreground">
              {[cand?.commune, cand?.ville].filter(Boolean).join(", ")}
            </p>
          )}
          <Badge className={`mt-1 ${meta.className}`}>{meta.label}</Badge>
        </div>
      </div>

      {application.message && (
        <p className="mt-3 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
          « {application.message} »
        </p>
      )}

      {/* Toujours accessible : consulter le profil avant de décider */}
      {cand && (
        <Button asChild variant="secondary" size="sm" className="mt-3 w-full">
          <Link href={`/app/candidates/${cand.id}`}>
            <UserRound className="size-4" /> Voir le profil de la candidate
          </Link>
        </Button>
      )}

      {!decided && (
        <div className="mt-2 flex gap-2">
          {status === "en_attente" && (
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setNewStatus("consultee")} disabled={loading}>
              <Eye className="size-4" /> Marquer consultée
            </Button>
          )}
          <Button variant="destructive" size="sm" className="flex-1" onClick={() => setNewStatus("refusee")} disabled={loading}>
            <X className="size-4" /> Refuser
          </Button>
          <Button size="sm" className="flex-1" onClick={() => setNewStatus("acceptee")} disabled={loading}>
            <Check className="size-4" /> Accepter
          </Button>
        </div>
      )}
    </div>
  );
}
