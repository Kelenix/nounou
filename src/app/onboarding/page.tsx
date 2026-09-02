import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { OnboardingForm } from "@/features/profiles/onboarding-form";

export const metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (profile.role) redirect(profile.role === "admin" ? "/admin" : "/app");

  return <OnboardingForm profile={profile} />;
}
