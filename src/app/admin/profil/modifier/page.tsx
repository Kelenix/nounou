import { requireRole } from "@/lib/auth";
import { ProfileEditForm } from "@/features/profiles/profile-edit-form";

export const metadata = { title: "Modifier mon profil" };

/**
 * Édition du profil d'un administrateur / membre du staff.
 * Réutilise `ProfileEditForm` : pour un rôle admin, seules les infos communes
 * (photo, prénom, nom, ville, commune) sont affichées — comme tout utilisateur.
 */
export default async function AdminEditProfilePage() {
  const profile = await requireRole("admin");
  return (
    <div className="mx-auto max-w-xl">
      <ProfileEditForm profile={profile} candidate={null} employer={null} />
    </div>
  );
}
