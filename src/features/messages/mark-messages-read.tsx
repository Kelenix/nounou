"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Marque comme lus les messages reçus de la conversation, puis rafraîchit
 * (met à jour le badge « messages » de la sidebar). Exécuté une seule fois.
 */
export function MarkMessagesRead({
  conversationId,
  userId,
  hasUnread,
}: {
  conversationId: string;
  userId: string;
  hasUnread: boolean;
}) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    (async () => {
      await createClient()
        .from("messages")
        .update({ lu: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("lu", false);
      router.refresh();
    })();
  }, [conversationId, userId, hasUnread, router]);

  return null;
}
