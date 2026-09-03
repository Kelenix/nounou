import { BellOff } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationIcon } from "@/features/notifications/notification-icon";
import { AutoMarkRead } from "@/features/notifications/auto-mark-read";
import { cn, dateLocale } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("notifications.metaTitle") };
}

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());

  const { data: notifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = notifs ?? [];
  const hasUnread = list.some((n) => !n.lu);

  return (
    <div className="space-y-4">
      <AutoMarkRead userId={profile.id} hasUnread={hasUnread} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("notifications.title")}</h1>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <BellOff className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4",
                n.lu ? "border-border bg-card" : "border-primary/30 bg-primary-soft/30",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <NotificationIcon type={n.type} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{n.titre}</p>
                {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString(dl, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {!n.lu && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
