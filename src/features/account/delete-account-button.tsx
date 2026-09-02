"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function DeleteAccountButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setLoading(false);
      toast("Suppression impossible. Réessayez.", "error");
      return;
    }
    // Nettoie la session locale puis redirige vers l'accueil.
    await createClient().auth.signOut();
    toast("Votre compte a été supprimé.", "success");
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <Button variant="destructive" className="w-full" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> Supprimer mon compte
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={(o) => !loading && setOpen(o)}
        title="Supprimer votre compte ?"
        description="Votre compte et toutes vos données (profil, candidatures, offres, messages, avis…) seront définitivement supprimés. Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
        destructive
        loading={loading}
        onConfirm={remove}
      />
    </>
  );
}
