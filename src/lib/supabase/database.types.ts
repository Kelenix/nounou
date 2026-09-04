// Types de la base de données « J'ai ma nounou ».
// Rédigé à la main d'après les migrations ; régénérable via `npm run db:types`
// (supabase gen types typescript --local) une fois la base locale lancée.

export type UserRole = "candidate" | "employer" | "admin";
export type VerificationLevel = "phone" | "identity" | "verified";
export type ServiceType =
  | "menage"
  | "cuisine"
  | "garde_enfants"
  | "lessive"
  | "repassage"
  | "entretien"
  | "assistance_personnes_agees"
  | "autre";
export type OfferStatus = "active" | "close";
export type ApplicationStatus =
  | "en_attente"
  | "consultee"
  | "acceptee"
  | "refusee"
  | "annulee";
export type ReportMotif =
  | "fausse_identite"
  | "arnaque"
  | "harcelement"
  | "offre_frauduleuse"
  | "comportement"
  | "conditions_differentes"
  | "autre";
export type ReportStatus = "ouvert" | "en_cours" | "traite" | "rejete";
export type PaymentMethod = "orange_money" | "mtn_momo" | "moov_money" | "wave" | "carte";
export type PaymentStatus = "en_attente" | "reussi" | "echoue" | "annule";
export type PaymentType = "activation_candidate" | "premium_employeur";
export type RatingContext =
  | "employer_rates_candidate"
  | "candidate_rates_employer";
export type NotificationType =
  | "nouvelle_candidature"
  | "candidature_acceptee"
  | "candidature_refusee"
  | "paiement_confirme"
  | "profil_verifie"
  | "signalement"
  | "nouveau_message"
  | "systeme";

// NB : ces lignes sont des alias `type` (et non `interface`) à dessein — un alias
// possède une index-signature implicite, requise pour satisfaire `GenericSchema`
// de postgrest-js (une interface échouerait `extends Record<string, unknown>`).
type Timestamps = { created_at: string; updated_at: string };

export type ProfileRow = {
  id: string;
  phone: string | null;
  phone_verified: boolean;
  role: UserRole | null;
  nom: string | null;
  prenom: string | null;
  photo_url: string | null;
  ville: string | null;
  commune: string | null;
  verification_level: VerificationLevel;
  is_active: boolean;
  is_suspended: boolean;
  is_super_admin: boolean;
  staff_permissions: string[];
  created_at: string;
  updated_at: string;
};

export type AdminAuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type PublicProfileRow = {
  id: string;
  role: UserRole | null;
  nom: string | null;
  prenom: string | null;
  photo_url: string | null;
  ville: string | null;
  commune: string | null;
  verification_level: VerificationLevel;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
};

export type CandidateProfileRow = Timestamps & {
  user_id: string;
  services: ServiceType[];
  experience_annees: number;
  competences: string[];
  disponibilite: string | null;
  temps_plein: boolean;
  description: string | null;
  salaire_souhaite: number | null;
  is_active_paid: boolean;
};

export type EmployerProfileRow = Timestamps & {
  user_id: string;
  type_besoin: string | null;
  description: string | null;
  nb_personnes_foyer: number | null;
  type_logement: string | null;
  horaires: string | null;
  salaire_propose: number | null;
  conditions: string | null;
  is_premium: boolean;
};

export type OfferRow = Timestamps & {
  id: string;
  employer_id: string;
  titre: string;
  type_service: ServiceType;
  description: string | null;
  ville: string;
  commune: string | null;
  quartier: string | null;
  horaires: string | null;
  salaire: number | null;
  type_contrat: string | null;
  logee: boolean | null;
  date_debut: string | null;
  experience_souhaitee: number | null;
  conditions: string | null;
  status: OfferStatus;
};

export type ApplicationRow = Timestamps & {
  id: string;
  offer_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  message: string | null;
};

export type FavoriteRow = {
  employer_id: string;
  candidate_id: string;
  created_at: string;
};

export type RatingRow = {
  id: string;
  from_user: string;
  to_user: string;
  role_context: RatingContext;
  ponctualite: number | null;
  serieux: number | null;
  qualite: number | null;
  respect: number | null;
  communication: number | null;
  note_moyenne: number | null;
  commentaire: string | null;
  created_at: string;
};

export type ReportRow = {
  id: string;
  from_user: string;
  target_user: string;
  motif: ReportMotif;
  description: string | null;
  status: ReportStatus;
  created_at: string;
};

export type PaymentRow = Timestamps & {
  id: string;
  user_id: string;
  montant: number;
  moyen: PaymentMethod;
  reference_transaction: string | null;
  statut: PaymentStatus;
  type: PaymentType;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  titre: string;
  message: string | null;
  lu: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  employer_id: string;
  candidate_id: string;
  offer_id: string | null;
  last_message_at: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  contenu: string;
  lu: boolean;
  created_at: string;
};

export type SettingRow = {
  key: string;
  value: unknown;
  updated_at: string;
};

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      candidate_profiles: TableDef<CandidateProfileRow>;
      employer_profiles: TableDef<EmployerProfileRow>;
      offers: TableDef<OfferRow>;
      applications: TableDef<ApplicationRow>;
      favorites: TableDef<FavoriteRow>;
      ratings: TableDef<RatingRow>;
      reports: TableDef<ReportRow>;
      payments: TableDef<PaymentRow>;
      notifications: TableDef<NotificationRow>;
      conversations: TableDef<ConversationRow>;
      messages: TableDef<MessageRow>;
      settings: TableDef<SettingRow>;
      admin_audit_log: TableDef<AdminAuditLogRow>;
    };
    Views: {
      public_profiles: { Row: PublicProfileRow; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      app_current_role: { Args: Record<string, never>; Returns: UserRole };
      candidate_phone: { Args: { candidate: string }; Returns: string | null };
      admin_user_id_by_email: { Args: { p_email: string }; Returns: string | null };
    };
    Enums: {
      user_role: UserRole;
      verification_level: VerificationLevel;
      service_type: ServiceType;
      offer_status: OfferStatus;
      application_status: ApplicationStatus;
      report_motif: ReportMotif;
      report_status: ReportStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      payment_type: PaymentType;
      rating_context: RatingContext;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
