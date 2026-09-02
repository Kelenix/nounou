import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { listConversations } from "@/features/messages/queries";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const profile = await requireProfile();
  const conversations = await listConversations(profile.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Messages</h1>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <MessageCircle className="size-8" />
            </span>
            <h2 className="font-bold">Aucune conversation</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              {profile.role === "employer"
                ? "Contactez une nounou depuis son profil pour démarrer une conversation."
                : "Les employeurs qui vous contactent apparaîtront ici."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {conversations.map((c) => {
            const name = `${c.other.prenom ?? ""} ${c.other.nom ?? ""}`.trim() || "Utilisateur";
            return (
              <Link key={c.id} href={`/app/messages/${c.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary">
                <Avatar src={c.other.photo_url} nom={c.other.nom} prenom={c.other.prenom} className="size-12" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(c.lastAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{c.lastMessage ?? "Nouvelle conversation"}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
