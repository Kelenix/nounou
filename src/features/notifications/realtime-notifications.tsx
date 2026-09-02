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
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router, toast]);

  return null;
}
