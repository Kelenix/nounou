import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ACCOUNT_RETENTION_MONTHS } from "@/lib/constants";

type Admin = SupabaseClient<Database>;

/** Garde-fou : nombre max de comptes anonymisés par exécution. */
const MAX_PER_RUN = 200;

export type PurgeResult = { anonymized: number };

/**
 * Anonymisation des comptes supprimés dont la durée de conservation est écoulée.
 *
 * Principe : on EFFACE les données personnelles du profil (nom, photo, téléphone…)
 * mais on CONSERVE la ligne — donc les paiements, avis et signalements liés restent
 * en base, désormais rattachés à un profil anonyme. On préserve ainsi les
 * statistiques et une traçabilité minimale sans garder d'identité en clair.
 *
 * Le compte auth reste banni ; on tente en plus d'effacer son e-mail/téléphone
 * (best-effort). `anonymized_at` rend l'opération idempotente.
 */
export async function purgeDeletedAccounts(admin: Admin): Promise<PurgeResult> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - ACCOUNT_RETENTION_MONTHS);

  const { data: expired } = await admin
    .from("profiles")
    .select("id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff.toISOString())
    .is("anonymized_at", null)
    .limit(MAX_PER_RUN);

  const result: PurgeResult = { anonymized: 0 };

  for (const { id } of expired ?? []) {
    // 1) Effacer les données personnelles du profil (téléphone = placeholder unique,
    //    car la colonne est `unique not null`).
    await admin
      .from("profiles")
      .update({
        nom: null,
        prenom: null,
        photo_url: null,
        date_naissance: null,
        ville: null,
        commune: null,
        identity_doc_path: null,
        phone: `supprime-${id}`,
        email_opt_out: true,
        anonymized_at: new Date().toISOString(),
      })
      .eq("id", id);

    // 2) Supprimer ses notifications (privées et sans valeur après anonymisation).
    await admin.from("notifications").delete().eq("user_id", id);

    // 3) Best-effort : effacer l'identité côté auth (le compte reste banni).
    try {
      await admin.auth.admin.updateUserById(id, {
        email: `deleted-${id}@deleted.invalid`,
        user_metadata: {},
      });
    } catch {
      // Sans effet sur la purge : l'e-mail auth sera réessayé au prochain passage
      // uniquement si le compte n'est pas encore marqué anonymisé (il l'est ici).
    }

    result.anonymized++;
  }

  return result;
}
