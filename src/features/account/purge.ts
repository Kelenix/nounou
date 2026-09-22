import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ACCOUNT_RETENTION_MONTHS } from "@/lib/constants";

type Admin = SupabaseClient<Database>;

/** Garde-fou : nombre max de comptes anonymisés par exécution. */
const MAX_PER_RUN = 200;

export type PurgeResult = { anonymized: number };

/**
 * Anonymise UN compte supprimé : on EFFACE les données personnelles du profil
 * (nom, photo, téléphone, e-mail auth) mais on CONSERVE la ligne — donc les
 * paiements, avis et signalements liés restent en base, rattachés à un profil
 * anonyme (statistiques préservées). Libère l'e-mail et le téléphone pour qu'ils
 * puissent resservir à une nouvelle inscription. `anonymized_at` rend l'opération
 * idempotente. Le compte auth reste banni.
 *
 * ⚠️ À appeler seulement après avoir posé `deleted_at` (le garde d'identité
 * `enforce_profile_identity` exempte les comptes supprimés).
 */
export async function anonymizeAccount(admin: Admin, id: string): Promise<void> {
  // 1) Effacer les données perso du profil (téléphone = placeholder unique → libère
  //    le vrai numéro ; la colonne est unique).
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

  // 3) Best-effort : effacer l'identité côté auth → libère l'e-mail (réutilisable
  //    pour une nouvelle inscription). Le compte reste banni.
  try {
    await admin.auth.admin.updateUserById(id, {
      email: `deleted-${id}@deleted.invalid`,
      user_metadata: {},
    });
  } catch {
    // Best-effort : ne bloque pas la suppression/purge.
  }
}

/**
 * Anonymisation en lot des comptes supprimés dont la durée de conservation est
 * écoulée (filet de sécurité : les suppressions anonymisent déjà immédiatement).
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
    await anonymizeAccount(admin, id);
    result.anonymized++;
  }
  return result;
}
