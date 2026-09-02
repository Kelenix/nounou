"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

/** Ouvre (ou crée) la conversation employeur → candidate, puis y navigue. */
export function StartConversationButton({
  employerId,
  candidateId,
  label = "Envoyer un message",
}: {
  employerId: string;
  candidateId: string;
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
      toast("Impossible d'ouvrir la conversation.", "error");
      return;
    }
    router.push(`/app/messages/${data.id}`);
  }

  return (
    <Button className="w-full" onClick={open} disabled={loading}>
      {loading ? <Spinner className="text-primary-foreground" /> : <><MessageCircle className="size-4" /> {label}</>}
    </Button>
  );
}
