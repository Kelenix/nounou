import { requireRole } from "@/lib/auth";
import { OfferForm } from "@/features/offers/offer-form";

export const metadata = { title: "Publier une offre" };

export default async function NouvelleOffrePage() {
  const profile = await requireRole("employer");
  return <OfferForm employerId={profile.id} />;
}
