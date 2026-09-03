"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

/**
 * Abonnement Realtime aux nouvelles notifications de l'utilisateur :
 * met à jour le badge (router.refresh) et affiche un toast.
 */
export function RealtimeNotifications({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Le socket Realtime doit porter le JWT de l'utilisateur AVANT de rejoindre le
    // canal : sinon la RLS (`user_id = auth.uid()`) évalue auth.uid() = NULL et les
    // notifications ne sont jamais livrées (il fallait recharger la page).
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      supabase.realtime.setAuth(data.session?.access_token ?? null);
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const titre = (payload.new as { titre?: string })?.titre;
            if (titre) toast(titre, "info");
            router.refresh();
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, router, toast]);

  return null;
}
