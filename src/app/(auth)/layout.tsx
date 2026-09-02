import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/brand/site-header";
import { getCurrentProfile } from "@/lib/auth";

/** Layout des pages d'authentification : navbar seule, PAS de footer (évite le défilement).
 *  Un utilisateur déjà connecté est renvoyé vers son espace (pas d'accès à connexion/inscription). */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/app");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
