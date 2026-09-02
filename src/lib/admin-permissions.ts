import type { ProfileRow } from "@/lib/supabase/database.types";

/** Sections attribuables à un membre du staff (le Super Admin a tout). */
export const STAFF_SECTIONS = [
  { key: "users", label: "Utilisateurs & abonnements" },
  { key: "offers", label: "Offres" },
  { key: "reports", label: "Signalements" },
  { key: "settings", label: "Paramètres du site (tarifs)" },
] as const;

export type StaffSection = (typeof STAFF_SECTIONS)[number]["key"];

/** Un admin peut-il accéder à une section ? (Super Admin = tout.) */
export function canAccess(
  profile: Pick<ProfileRow, "is_super_admin" | "staff_permissions">,
  section: StaffSection,
): boolean {
  return profile.is_super_admin || (profile.staff_permissions ?? []).includes(section);
}
