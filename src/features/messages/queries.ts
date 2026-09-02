import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MessageRow, PublicProfileRow } from "@/lib/supabase/database.types";

export type ConversationListItem = {
  id: string;
  other: Pick<PublicProfileRow, "id" | "nom" | "prenom" | "photo_url">;
  lastMessage: string | null;
  lastAt: string;
  unread: number;
};

/** Conversations de l'utilisateur courant (avec l'autre participant + dernier message + non-lus). */
export async function listConversations(userId: string): Promise<ConversationListItem[]> {
  const supabase = await createClient();
  const { data: convs } = await supabase
    .from("conversations")
    .select("id, employer_id, candidate_id, last_message_at")
    .order("last_message_at", { ascending: false });

  const list = convs ?? [];
  if (list.length === 0) return [];

  const otherIds = list.map((c) => (c.employer_id === userId ? c.candidate_id : c.employer_id));
  const { data: profs } = await supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url")
    .in("id", otherIds);
  const profById = new Map((profs ?? []).map((p) => [p.id, p]));

  const ids = list.map((c) => c.id);
  const { data: msgs } = await supabase
    .from("messages")
    .select("conversation_id, contenu, sender_id, lu, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false });

  const lastByConv = new Map<string, string>();
  const unreadByConv = new Map<string, number>();
  for (const m of msgs ?? []) {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m.contenu);
    if (m.sender_id !== userId && !m.lu) unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
  }

  return list.map((c) => {
    const otherId = c.employer_id === userId ? c.candidate_id : c.employer_id;
    const p = profById.get(otherId) ?? { id: otherId, nom: null, prenom: null, photo_url: null };
    return {
      id: c.id,
      other: p,
      lastMessage: lastByConv.get(c.id) ?? null,
      lastAt: c.last_message_at,
      unread: unreadByConv.get(c.id) ?? 0,
    };
  });
}

export type ConversationThread = {
  id: string;
  other: Pick<PublicProfileRow, "id" | "nom" | "prenom" | "photo_url">;
  messages: Pick<MessageRow, "id" | "sender_id" | "contenu" | "created_at">[];
  hasUnread: boolean;
};

/** Fil d'une conversation (messages + autre participant). Renvoie null si non autorisé/absent. */
export async function getConversationThread(id: string, userId: string): Promise<ConversationThread | null> {
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, employer_id, candidate_id")
    .eq("id", id)
    .maybeSingle();
  if (!conv) return null;
  if (conv.employer_id !== userId && conv.candidate_id !== userId) return null;

  const otherId = conv.employer_id === userId ? conv.candidate_id : conv.employer_id;
  const { data: other } = await supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url")
    .eq("id", otherId)
    .maybeSingle();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, contenu, created_at, lu")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  // (Le marquage « lu » est fait côté client — cf. MarkMessagesRead — pour
  //  pouvoir rafraîchir le badge de la sidebar après coup.)
  const rows = messages ?? [];
  const hasUnread = rows.some((m) => m.sender_id !== userId && !m.lu);

  return {
    id: conv.id,
    other: other ?? { id: otherId, nom: null, prenom: null, photo_url: null },
    messages: rows.map(({ id: mid, sender_id, contenu, created_at }) => ({ id: mid, sender_id, contenu, created_at })),
    hasUnread,
  };
}

/** Compte total de messages non lus (pour le badge). */
export async function countUnreadMessages(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("lu", false)
    .neq("sender_id", userId);
  return count ?? 0;
}
