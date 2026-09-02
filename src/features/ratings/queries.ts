import "server-only";

import { createClient } from "@/lib/supabase/server";

export type RatingSummary = { average: number | null; count: number };

/** Moyenne + nombre de notes reçues par un utilisateur. */
export async function getRatingSummary(userId: string): Promise<RatingSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select("note_moyenne")
    .eq("to_user", userId);

  if (!data || data.length === 0) return { average: null, count: 0 };
  const notes = data.map((r) => Number(r.note_moyenne ?? 0));
  const average = notes.reduce((a, b) => a + b, 0) / notes.length;
  return { average: Math.round(average * 10) / 10, count: notes.length };
}
