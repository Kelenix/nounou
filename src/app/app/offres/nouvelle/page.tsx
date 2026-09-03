import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { OfferForm } from "@/features/offers/offer-form";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("offerForm.metaTitle") };
}

export default async function NouvelleOffrePage() {
  const profile = await requireRole("employer");
  return <OfferForm employerId={profile.id} />;
}
