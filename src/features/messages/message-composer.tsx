"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function MessageComposer({
  conversationId,
  senderId,
}: {
  conversationId: string;
  senderId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const contenu = text.trim();
    if (!contenu) return;
    setLoading(true);
    const { error } = await createClient().from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      contenu,
    });
    setLoading(false);
    if (error) {
      toast(t("messages.sendFailed"), "error");
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <form onSubmit={send} className="flex items-end gap-2 border-t border-border bg-background p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send(e);
          }
        }}
        rows={1}
        placeholder={t("messages.typePlaceholder")}
        className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" size="icon" className="size-11 shrink-0" disabled={loading || !text.trim()}>
        {loading ? <Spinner className="text-primary-foreground" /> : <Send className="size-5" />}
      </Button>
    </form>
  );
}
