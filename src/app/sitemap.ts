import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600; // régénéré toutes les heures

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? "https://jaimanounou.com").replace(/\/$/, "");

const STATIC_PATHS = [
  "",
  "/nounous",
  "/offres",
  "/comment-ca-marche",
  "/tarifs",
  "/faq",
  "/contact",
  "/cgu",
  "/confidentialite",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: p === "" ? 1 : 0.7,
  }));

  // Pages dynamiques publiques : nounous activées + offres actives.
  try {
    const supabase = await createClient();

    const { data: actives } = await supabase
      .from("candidate_profiles")
      .select("user_id")
      .eq("is_active_paid", true)
      .limit(5000);
    for (const a of actives ?? []) {
      entries.push({ url: `${BASE}/nounous/${a.user_id}`, changeFrequency: "weekly", priority: 0.6 });
    }

    const { data: offers } = await supabase
      .from("offers")
      .select("id")
      .eq("status", "active")
      .limit(5000);
    for (const o of offers ?? []) {
      entries.push({ url: `${BASE}/offres/${o.id}`, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    // Base indisponible : on renvoie au moins le sitemap statique.
  }

  return entries;
}
