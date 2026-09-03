"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Ban, RotateCcw, CreditCard, Trash2, UserCog, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatFcfa, dateLocale } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { UserRole, PaymentMethod } from "@/lib/supabase/database.types";

export type SubscriptionInfo = {
  label: string;
  montant: number | null;
  moyen: PaymentMethod | null;
  date: string | null;
};

type Dialog = "suspend" | "cancel" | "delete" | "role" | null;

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
  const t = useTranslations();
  const dl = dateLocale(useLocale());
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
      toast(next ? t("admin.toastSuspended") : t("admin.toastReactivated"), "success");
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
      toast(data?.error ?? t("admin.actionFailed"), "error");
      return false;
    }
    return true;
  }

  async function confirmRole() {
    if (await callApi("set_role", { role: newRole })) {
      setDialog(null);
      toast(t("admin.toastRoleUpdated"), "success");
      router.refresh();
    }
  }

  async function confirmCancel() {
    if (await callApi("cancel_subscription")) {
      setHasSub(false);
      setDialog(null);
      toast(t("admin.toastSubCancelled"), "success");
      router.refresh();
    }
  }

  async function confirmDelete() {
    if (await callApi("delete")) {
      setDialog(null);
      toast(t("admin.toastAccountDeleted"), "success");
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {hasSub && (
          <Button variant="secondary" size="sm" onClick={() => setDialog("cancel")}>
            <CreditCard className="size-4" /> {t("admin.btnCancelSub")}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => { setNewRole(role ?? "candidate"); setDialog("role"); }}>
          <UserCog className="size-4" /> {t("admin.btnRole")}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setDialog("suspend")}>
          {isSuspended ? (
            <>
              <RotateCcw className="size-4" /> {t("admin.btnReactivate")}
            </>
          ) : (
            <>
              <Ban className="size-4" /> {t("admin.btnSuspend")}
            </>
          )}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDialog("delete")}>
          <Trash2 className="size-4" /> {t("admin.btnDelete")}
        </Button>
      </div>

      {/* Suspendre / Réactiver */}
      <ConfirmDialog
        open={dialog === "suspend"}
        onOpenChange={close}
        title={isSuspended ? t("admin.reactivateTitle") : t("admin.suspendTitle")}
        description={
          isSuspended
            ? t("admin.reactivateDesc", { name })
            : role === "candidate"
              ? t("admin.suspendDescCandidate", { name })
              : t("admin.suspendDesc", { name })
        }
        confirmLabel={isSuspended ? t("admin.btnReactivate") : t("admin.btnSuspend")}
        destructive={!isSuspended}
        loading={loading}
        onConfirm={confirmSuspend}
      />

      {/* Annuler l'abonnement */}
      <ConfirmDialog
        open={dialog === "cancel"}
        onOpenChange={close}
        title={t("admin.cancelSubTitle")}
        description={role === "candidate" ? t("admin.cancelSubDescCandidate", { name }) : t("admin.cancelSubDesc", { name })}
        confirmLabel={t("admin.cancelSubConfirm")}
        destructive
        loading={loading}
        onConfirm={confirmCancel}
      >
        <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("admin.subDetails")}</p>
          <Row label={t("admin.plan")} value={subscription?.label ?? (role === "candidate" ? t("admin.subActivation") : t("admin.subPremium"))} />
          <Row label={t("admin.amount")} value={subscription?.montant != null ? formatFcfa(subscription.montant) : "—"} />
          <Row label={t("admin.method")} value={subscription?.moyen ? PAYMENT_METHOD_LABELS[subscription.moyen] : "—"} />
          <Row
            label={t("admin.since")}
            value={subscription?.date ? new Date(subscription.date).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" }) : "—"}
          />
        </div>
      </ConfirmDialog>

      {/* Changer le rôle */}
      <ConfirmDialog
        open={dialog === "role"}
        onOpenChange={close}
        title={t("admin.roleOf", { name })}
        description={t("admin.roleDesc")}
        confirmLabel={t("admin.saveRole")}
        loading={loading}
        onConfirm={confirmRole}
      >
        <div className="space-y-1.5">
          <Label>{t("admin.roleLabel")}</Label>
          <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
            <option value="candidate">{t("roles.candidate")}</option>
            <option value="employer">{t("roles.employer")}</option>
            {isSuperAdmin && <option value="admin">{t("admin.roleAdmin")}</option>}
          </Select>
          {newRole === "admin" && (
            <p className="inline-flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="size-3.5" /> {t("admin.adminWarning")}
            </p>
          )}
        </div>
      </ConfirmDialog>

      {/* Supprimer */}
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={close}
        title={t("admin.deleteTitle")}
        description={t("admin.deleteDesc", { name })}
        confirmLabel={t("admin.deleteConfirm")}
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
