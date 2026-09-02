"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw, CreditCard, Trash2, UserCog, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatFcfa } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { UserRole, PaymentMethod } from "@/lib/supabase/database.types";

export type SubscriptionInfo = {
  label: string;
  montant: number | null;
  moyen: PaymentMethod | null;
  date: string | null;
};

type Dialog = "suspend" | "cancel" | "delete" | "role" | null;

const ROLE_LABEL: Record<UserRole, string> = { candidate: "Candidate", employer: "Employeur", admin: "Administrateur" };

export function UserActions({
  userId,
  name,
  role,
  suspended,
  hasSubscription,
  subscription,
  isSuperAdmin = false,
}: {
  userId: string;
  name: string;
  role: UserRole | null;
  suspended: boolean;
  hasSubscription: boolean;
  subscription: SubscriptionInfo | null;
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSuspended, setIsSuspended] = useState(suspended);
  const [hasSub, setHasSub] = useState(hasSubscription);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [newRole, setNewRole] = useState<UserRole>(role ?? "candidate");
  const [loading, setLoading] = useState(false);

  const close = () => !loading && setDialog(null);

  async function confirmSuspend() {
    const next = !isSuspended;
    if (await callApi("suspend", { suspended: next })) {
      setIsSuspended(next);
      setDialog(null);
      toast(next ? "Compte suspendu" : "Compte réactivé", "success");
      router.refresh();
    }
  }

  async function callApi(action: "cancel_subscription" | "delete" | "set_role" | "suspend", extra?: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId, ...extra }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      toast(data?.error ?? "Action impossible.", "error");
      return false;
    }
    return true;
  }

  async function confirmRole() {
    if (await callApi("set_role", { role: newRole })) {
      setDialog(null);
      toast("Rôle mis à jour", "success");
      router.refresh();
    }
  }

  async function confirmCancel() {
    if (await callApi("cancel_subscription")) {
      setHasSub(false);
      setDialog(null);
      toast("Abonnement annulé", "success");
      router.refresh();
    }
  }

  async function confirmDelete() {
    if (await callApi("delete")) {
      setDialog(null);
      toast("Compte supprimé", "success");
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {hasSub && (
          <Button variant="secondary" size="sm" onClick={() => setDialog("cancel")}>
            <CreditCard className="size-4" /> Annuler l&apos;abo
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => { setNewRole(role ?? "candidate"); setDialog("role"); }}>
          <UserCog className="size-4" /> Rôle
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDialog("suspend")}>
          {isSuspended ? (
            <>
              <RotateCcw className="size-4" /> Réactiver
            </>
          ) : (
            <>
              <Ban className="size-4" /> Suspendre
            </>
          )}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDialog("delete")}>
          <Trash2 className="size-4" /> Supprimer
        </Button>
      </div>

      {/* Suspendre / Réactiver */}
      <ConfirmDialog
        open={dialog === "suspend"}
        onOpenChange={close}
        title={isSuspended ? "Réactiver ce compte ?" : "Suspendre ce compte ?"}
        description={
          isSuspended
            ? `${name} pourra de nouveau se connecter et utiliser la plateforme.`
            : `${name} ne pourra plus se connecter${role === "candidate" ? " et ne sera plus visible dans le catalogue" : ""}. Vous pourrez réactiver le compte à tout moment.`
        }
        confirmLabel={isSuspended ? "Réactiver" : "Suspendre"}
        destructive={!isSuspended}
        loading={loading}
        onConfirm={confirmSuspend}
      />

      {/* Annuler l'abonnement */}
      <ConfirmDialog
        open={dialog === "cancel"}
        onOpenChange={close}
        title="Annuler l'abonnement ?"
        description={`L'abonnement de ${name} sera désactivé.${role === "candidate" ? " Le profil ne sera plus visible dans le catalogue public." : " L'accès premium sera retiré."}`}
        confirmLabel="Confirmer l'annulation"
        destructive
        loading={loading}
        onConfirm={confirmCancel}
      >
        <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Détails de l&apos;abonnement</p>
          <Row label="Formule" value={subscription?.label ?? (role === "candidate" ? "Activation du profil" : "Accès premium")} />
          <Row label="Montant" value={subscription?.montant != null ? formatFcfa(subscription.montant) : "—"} />
          <Row label="Moyen" value={subscription?.moyen ? PAYMENT_METHOD_LABELS[subscription.moyen] : "—"} />
          <Row
            label="Depuis le"
            value={subscription?.date ? new Date(subscription.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
          />
        </div>
      </ConfirmDialog>

      {/* Changer le rôle */}
      <ConfirmDialog
        open={dialog === "role"}
        onOpenChange={close}
        title={`Rôle de ${name}`}
        description="Attribuez un rôle sur la plateforme. Promouvoir en administrateur donne l'accès complet au back-office."
        confirmLabel="Enregistrer le rôle"
        loading={loading}
        onConfirm={confirmRole}
      >
        <div className="space-y-1.5">
          <Label>Rôle</Label>
          <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
            <option value="candidate">{ROLE_LABEL.candidate}</option>
            <option value="employer">{ROLE_LABEL.employer}</option>
            {isSuperAdmin && <option value="admin">{ROLE_LABEL.admin}</option>}
          </Select>
          {newRole === "admin" && (
            <p className="inline-flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="size-3.5" /> Cet utilisateur aura un accès administrateur complet.
            </p>
          )}
        </div>
      </ConfirmDialog>

      {/* Supprimer */}
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={close}
        title="Supprimer définitivement ce compte ?"
        description={`Le compte de ${name} et toutes ses données (profil, candidatures, offres, messages…) seront supprimés. Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        destructive
        loading={loading}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
