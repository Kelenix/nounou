"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
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
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (existingStatus) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4">
        <CheckCircle2 className="size-5 text-primary" />
        <span className="text-sm">
          {t("applications.alreadyApplied")}{" "}
          <span className="font-semibold">{t(`applicationStatus.${existingStatus}`)}</span>
        </span>
      </div>
    );
  }

  if (!isActivePaid) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {t("applications.activateToApply")}{" "}
        <a href="/app/paiement" className="font-semibold underline">{t("applications.activateNow")}</a>
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
      toast(t("applications.applyFailed"), "error");
      return;
    }
    toast(t("applications.applied"), "success");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)}>
        <Send className="size-4" /> {t("applications.apply")}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("applications.messagePlaceholder")}
      />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
          {t("applications.cancel")}
        </Button>
        <Button className="flex-1" onClick={apply} disabled={loading}>
          {loading ? <Spinner className="text-primary-foreground" /> : t("applications.send")}
        </Button>
      </div>
    </div>
  );
}
