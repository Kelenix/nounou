import type { ServiceType, ApplicationStatus, PaymentMethod } from "@/lib/supabase/database.types";

/** Libellés FR des types de service. */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  menage: "Ménage",
  cuisine: "Cuisine",
  garde_enfants: "Garde d'enfants",
  lessive: "Lessive",
  repassage: "Repassage",
  entretien: "Entretien",
  assistance_personnes_agees: "Assistance aux personnes âgées",
  autre: "Autre",
};

export const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS).map(
  ([value, label]) => ({ value: value as ServiceType, label }),
);

/** Libellés + couleurs des statuts de candidature. */
export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  en_attente: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  consultee: { label: "Consultée", className: "bg-blue-100 text-blue-800" },
  acceptee: { label: "Acceptée", className: "bg-primary-soft text-primary" },
  refusee: { label: "Refusée", className: "bg-red-100 text-red-700" },
  annulee: { label: "Annulée", className: "bg-muted text-muted-foreground" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  moov_money: "Moov Money",
  wave: "Wave",
  carte: "Carte bancaire",
};

/** Quelques villes/communes courantes de Côte d'Ivoire (liste non exhaustive). */
export const VILLES_CI = [
  "Abidjan",
  "Bouaké",
  "Yamoussoukro",
  "San-Pédro",
  "Korhogo",
  "Daloa",
  "Man",
];

export const COMMUNES_ABIDJAN = [
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Treichville",
  "Yopougon",
  "Bingerville",
  "Songon",
];

export const APP_NAME = "J'ai ma nounou";
