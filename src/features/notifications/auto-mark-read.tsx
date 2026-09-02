"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Marque les notifications comme lues à l'ouverture de la page, puis rafraîchit
 * pour faire disparaître le badge (compteur dans l'en-tête / la sidebar).
 */
export function AutoMarkRead({ userId, hasUnread }: { userId: string; hasUnread: boolean }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    (async () => {
      await createClient()
        .from("notifications")
        .update({ lu: true })
        .eq("user_id", userId)
        .eq("lu", false);
      router.refresh();
    })();
  }, [hasUnread, userId, router]);

  return null;
}
