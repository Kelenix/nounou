"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function DeleteAccountButton() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setLoading(false);
      toast(t("settings.deleteFailed"), "error");
      return;
    }
    // Nettoie la session locale puis redirige vers l'accueil.
    await createClient().auth.signOut();
    toast(t("settings.deleteSuccess"), "success");
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <Button variant="destructive" className="w-full" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> {t("settings.deleteAccount")}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={(o) => !loading && setOpen(o)}
        title={t("settings.deleteConfirmTitle")}
        description={t("settings.deleteConfirmDesc")}
        confirmLabel={t("settings.deleteConfirmLabel")}
        destructive
        loading={loading}
        onConfirm={remove}
      />
    </>
  );
}
