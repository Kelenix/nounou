import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { getConversationThread } from "@/features/messages/queries";
import { MessageComposer } from "@/features/messages/message-composer";
import { RealtimeMessages } from "@/features/messages/realtime-messages";
import { MarkMessagesRead } from "@/features/messages/mark-messages-read";
import { cn } from "@/lib/utils";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const thread = await getConversationThread(id, profile.id);
  if (!thread) notFound();

  const name = `${thread.other.prenom ?? ""} ${thread.other.nom ?? ""}`.trim() || "Utilisateur";

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card lg:h-[calc(100dvh-8rem)]">
      <RealtimeMessages conversationId={id} />
      <MarkMessagesRead conversationId={id} userId={profile.id} hasUnread={thread.hasUnread} />

      {/* En-tête */}
      <div className="flex items-center gap-3 border-b border-border p-3">
        <Link href="/app/messages" className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar src={thread.other.photo_url} nom={thread.other.nom} prenom={thread.other.prenom} className="size-10" />
        <span className="font-semibold">{name}</span>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {thread.messages.length === 0 ? (
          <p className="m-auto text-center text-sm text-muted-foreground">
            Démarrez la conversation avec {thread.other.prenom ?? name}.
          </p>
        ) : (
          thread.messages.map((m) => {
            const mine = m.sender_id === profile.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-foreground",
                  )}
                >
                  <p className="whitespace-pre-line">{m.contenu}</p>
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageComposer conversationId={id} senderId={profile.id} />
    </div>
  );
}
