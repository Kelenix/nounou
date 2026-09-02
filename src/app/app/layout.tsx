import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";
import { AppSidebar } from "@/components/app/app-sidebar";
import { RealtimeNotifications } from "@/features/notifications/realtime-notifications";
import { countUnreadMessages } from "@/features/messages/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  // Les administrateurs vont directement au back-office.
  if (profile.role === "admin") redirect("/admin");

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("lu", false);
  const unread = count ?? 0;
  const messagesUnread = await countUnreadMessages(profile.id);

  return (
    <div className="min-h-screen bg-secondary lg:flex">
      <RealtimeNotifications userId={profile.id} />
      <AppSidebar profile={profile} unread={unread} messagesUnread={messagesUnread} />

      <div className="flex min-h-screen flex-1 flex-col">
        {/* En-tête mobile uniquement (desktop = sidebar) */}
        <div className="lg:hidden">
          <AppHeader profile={profile} unread={unread} />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
