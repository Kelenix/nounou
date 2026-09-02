import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Pricing = {
  activationCandidate: number;
  premiumEmployeur: number;
};

const DEFAULTS: Pricing = { activationCandidate: 1000, premiumEmployeur: 2000 };

/** Lit les tarifs depuis `settings`, avec repli sur les valeurs par défaut. */
export async function getPricing(): Promise<Pricing> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["prix_activation_candidate", "prix_premium_employeur"]);

    if (!data) return DEFAULTS;
    const map = new Map(data.map((r) => [r.key, Number(r.value)]));
    return {
      activationCandidate: map.get("prix_activation_candidate") ?? DEFAULTS.activationCandidate,
      premiumEmployeur: map.get("prix_premium_employeur") ?? DEFAULTS.premiumEmployeur,
    };
  } catch {
    return DEFAULTS;
  }
}
