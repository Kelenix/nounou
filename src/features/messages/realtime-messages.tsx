"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Rafraîchit le fil quand un nouveau message arrive dans la conversation (Realtime). */
export function RealtimeMessages({ conversationId }: { conversationId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Authentifier le socket Realtime (JWT utilisateur) avant de rejoindre : la RLS
    // de `messages` filtre par participant, sinon aucun message n'est livré en direct.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      supabase.realtime.setAuth(data.session?.access_token ?? null);
      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          () => router.refresh(),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId, router]);

  return null;
}
