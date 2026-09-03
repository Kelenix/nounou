"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

/** Ouvre (ou crée) la conversation employeur → candidate, puis y navigue. */
export function StartConversationButton({
  employerId,
  candidateId,
  label,
}: {
  employerId: string;
  candidateId: string;
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const buttonLabel = label ?? t("messages.startConversation");

  async function open() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .upsert({ employer_id: employerId, candidate_id: candidateId }, { onConflict: "employer_id,candidate_id" })
      .select("id")
      .single();
    setLoading(false);
    if (error || !data) {
      toast(t("messages.openFailed"), "error");
      return;
    }
    router.push(`/app/messages/${data.id}`);
  }

  return (
    <Button className="w-full" onClick={open} disabled={loading}>
      {loading ? <Spinner className="text-primary-foreground" /> : <><MessageCircle className="size-4" /> {buttonLabel}</>}
    </Button>
  );
}
