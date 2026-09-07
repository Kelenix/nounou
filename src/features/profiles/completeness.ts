import type { ProfileRow, CandidateProfileRow, EmployerProfileRow } from "@/lib/supabase/database.types";

/**
 * Calcule le taux de complétude d'un profil + la liste des éléments manquants
 * (clés i18n `profile.completeness.item_<clé>`). Un profil complet inspire
 * davantage confiance et ressort mieux.
 */
export function profileCompleteness(
  profile: ProfileRow,
  candidate: CandidateProfileRow | null,
  employer: EmployerProfileRow | null,
): { percent: number; missing: string[] } {
  const items: { key: string; done: boolean }[] = [
    { key: "photo", done: !!profile.photo_url },
    { key: "name", done: (profile.prenom?.trim().length ?? 0) >= 2 && (profile.nom?.trim().length ?? 0) >= 2 },
    { key: "city", done: !!profile.ville },
    { key: "phone", done: !!profile.phone },
    { key: "dob", done: !!profile.date_naissance },
  ];

  if (profile.role === "candidate") {
    items.push(
      { key: "services", done: (candidate?.services?.length ?? 0) > 0 },
      { key: "experience", done: (candidate?.experience_annees ?? 0) > 0 },
      { key: "description", done: !!candidate?.description?.trim() },
      {
        key: "identity",
        done:
          !!profile.identity_doc_path ||
          profile.verification_level === "identity" ||
          profile.verification_level === "verified",
      },
    );
  } else if (profile.role === "employer") {
    items.push(
      { key: "needType", done: !!employer?.type_besoin?.trim() },
      { key: "description", done: !!employer?.description?.trim() },
    );
  }

  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);
  const missing = items.filter((i) => !i.done).map((i) => i.key);
  return { percent, missing };
}
