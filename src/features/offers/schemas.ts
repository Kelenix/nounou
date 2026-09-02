import { z } from "zod";
import type { ServiceType } from "@/lib/supabase/database.types";

const SERVICE_VALUES = [
  "menage",
  "cuisine",
  "garde_enfants",
  "lessive",
  "repassage",
  "entretien",
  "assistance_personnes_agees",
  "autre",
] as const satisfies readonly ServiceType[];

/** Offre : titre, type de service et ville obligatoires ; le reste optionnel. */
export const offerSchema = z.object({
  titre: z.string().trim().min(3, "Titre trop court").max(120),
  type_service: z.enum(SERVICE_VALUES),
  ville: z.string().trim().min(2, "Ville requise"),
  commune: z.string().trim().optional().or(z.literal("")),
  quartier: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  horaires: z.string().trim().optional().or(z.literal("")),
  salaire: z.coerce.number().int().min(0).optional().or(z.nan()),
  logee: z.boolean().optional(),
  experience_souhaitee: z.coerce.number().int().min(0).optional().or(z.nan()),
});

export type OfferInput = z.infer<typeof offerSchema>;
