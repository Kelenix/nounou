import Link from "next/link";
import { Home, UserCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { AdminSidebar } from "@/components/app/admin-sidebar";
import { AdminBottomNav } from "@/components/app/admin-bottom-nav";
import { SignOutButton } from "@/features/auth/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <div className="min-h-screen bg-secondary lg:flex">
      <AdminSidebar profile={profile} />

      <div className="flex min-h-screen flex-1 flex-col">
        {/* En-tête mobile uniquement */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Logo height={30} href="/admin" />
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">Admin</span>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/admin/profil/modifier" aria-label="Modifier mon profil" className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
                <UserCircle className="size-5" />
              </Link>
              <Link href="/" aria-label="Accueil du site" className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
                <Home className="size-5" />
              </Link>
              <SignOutButton iconOnly />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>

        <AdminBottomNav profile={profile} />
      </div>
    </div>
  );
}
