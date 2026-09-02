"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { OfferStatus } from "@/lib/supabase/database.types";

export function OfferStatusToggle({
  offerId,
  status,
}: {
  offerId: string;
  status: OfferStatus;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next: OfferStatus = status === "active" ? "close" : "active";
    const { error } = await supabase.from("offers").update({ status: next }).eq("id", offerId);
    setLoading(false);
    if (error) {
      toast("Action impossible.", "error");
      return;
    }
    toast(next === "close" ? "Offre clôturée" : "Offre réactivée", "success");
    router.refresh();
  }

  return (
    <Button variant="secondary" className="w-full" onClick={toggle} disabled={loading}>
      {status === "active" ? (
        <>
          <Lock className="size-4" /> Clôturer l&apos;offre
        </>
      ) : (
        <>
          <Unlock className="size-4" /> Réactiver l&apos;offre
        </>
      )}
    </Button>
  );
}
