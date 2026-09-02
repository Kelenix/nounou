import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/features/profiles/profile-edit-form";
import type { CandidateProfileRow, EmployerProfileRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Modifier le profil" };

export default async function EditProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let candidate: CandidateProfileRow | null = null;
  let employer: EmployerProfileRow | null = null;

  if (profile.role === "candidate") {
    const { data } = await supabase.from("candidate_profiles").select("*").eq("user_id", profile.id).maybeSingle();
    candidate = data;
  } else if (profile.role === "employer") {
    const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", profile.id).maybeSingle();
    employer = data;
  }

  return <ProfileEditForm profile={profile} candidate={candidate} employer={employer} />;
}
