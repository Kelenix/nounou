import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { OnboardingForm } from "@/features/profiles/onboarding-form";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("onboarding.metaTitle") };
}

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (profile.role) redirect(profile.role === "admin" ? "/admin" : "/app");

  return <OnboardingForm profile={profile} />;
}
