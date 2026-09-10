"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

/** Bouton (admin) de suppression d'une offre, avec confirmation. */
export function OfferDeleteButton({ offerId, titre }: { offerId: string; titre: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    const res = await fetch("/api/admin/offres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast(data?.error ?? t("admin.actionFailed"), "error");
      return;
    }
    setOpen(false);
    toast(t("admin.toastOfferDeleted"), "success");
    router.refresh();
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> {t("admin.btnDeleteOffer")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => !loading && setOpen(o)}
        title={t("admin.deleteOfferTitle")}
        description={t("admin.deleteOfferDesc", { titre })}
        confirmLabel={t("admin.btnDeleteOffer")}
        destructive
        loading={loading}
        onConfirm={remove}
      />
    </>
  );
}
