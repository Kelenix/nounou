"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next: OfferStatus = status === "active" ? "close" : "active";
    const { error } = await supabase.from("offers").update({ status: next }).eq("id", offerId);
    setLoading(false);
    if (error) {
      toast(t("offerManage.actionFailed"), "error");
      return;
    }
    toast(next === "close" ? t("offerManage.offerClosed") : t("offerManage.offerReopened"), "success");
    router.refresh();
  }

  return (
    <Button variant="secondary" className="w-full" onClick={toggle} disabled={loading}>
      {status === "active" ? (
        <>
          <Lock className="size-4" /> {t("offerManage.closeOffer")}
        </>
      ) : (
        <>
          <Unlock className="size-4" /> {t("offerManage.reopenOffer")}
        </>
      )}
    </Button>
  );
}
