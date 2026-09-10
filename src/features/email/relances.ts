import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sendEmail, escapeHtml } from "./mailer";

type Admin = SupabaseClient<Database>;

/** Paliers de la séquence (jours depuis l'inscription). Le nombre de paliers = plafond d'envois. */
const STEPS = [0, 1, 3, 7] as const;
const DAY_MS = 86_400_000;
/** Garde-fou : nombre max de comptes traités par exécution (évite un envoi massif accidentel). */
const MAX_PER_RUN = 300;

type Kind = "complete_profile" | "activate_candidate" | "activate_premium";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://jaimanounou.com";
}

function unsubSecret(): string {
  const s = process.env.EMAIL_UNSUB_SECRET;
  if (!s) throw new Error("EMAIL_UNSUB_SECRET manquant (jeton du lien de désinscription).");
  return s;
}

/** Jeton de désinscription (HMAC de l'id utilisateur) — non devinable, sans état en base. */
export function unsubToken(userId: string): string {
  return createHmac("sha256", unsubSecret()).update(userId).digest("hex");
}

export function verifyUnsubToken(userId: string, token: string): boolean {
  const a = Buffer.from(unsubToken(userId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

function unsubUrl(userId: string): string {
  return `${appUrl()}/api/email/desinscription?u=${userId}&t=${unsubToken(userId)}`;
}

/** Palier attendu aujourd'hui = le plus grand palier déjà atteint par l'ancienneté du compte. */
function currentStep(days: number): number | null {
  let expected: number | null = null;
  for (const s of STEPS) if (s <= days) expected = s;
  return expected;
}

// ---------------------------------------------------------------------------
// Gabarit d'e-mail (CTA + pied de désinscription obligatoire)
// ---------------------------------------------------------------------------

function relanceHtml(
  titre: string,
  message: string,
  ctaLabel: string,
  ctaUrl: string,
  userId: string,
): string {
  const t = escapeHtml(titre);
  const m = escapeHtml(message);
  const c = escapeHtml(ctaLabel);
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 8px;font-size:18px;color:#0f172a">${t}</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5">${m}</p>
      <a href="${ctaUrl}" style="display:inline-block;background:#2E9E1F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700">${c}</a>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;line-height:1.6">
      J'ai ma nounou · <a href="${appUrl()}" style="color:#94a3b8">${escapeHtml(appUrl())}</a><br>
      <a href="${unsubUrl(userId)}" style="color:#94a3b8">Ne plus recevoir ces rappels</a>
    </p>
  </div></body></html>`;
}

// ---------------------------------------------------------------------------
// Contenu par type de relance
// ---------------------------------------------------------------------------

type Target = {
  userId: string;
  createdAt: string;
  kind: Kind;
  subject: string;
  titre: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
};

function completeProfileTarget(p: { id: string; created_at: string; role: string | null }): Target {
  // Rôle non choisi → onboarding ; sinon champs de profil manquants → édition du profil.
  const ctaUrl = p.role ? `${appUrl()}/app/profil` : `${appUrl()}/onboarding`;
  return {
    userId: p.id,
    createdAt: p.created_at,
    kind: "complete_profile",
    subject: "Terminez votre inscription · J'ai ma nounou",
    titre: "Il vous reste une étape",
    message:
      "Votre inscription sur J'ai ma nounou n'est pas encore terminée. Complétez votre profil " +
      "en quelques secondes pour en profiter pleinement.",
    ctaLabel: "Compléter mon profil",
    ctaUrl,
  };
}

function activateCandidateTarget(p: { id: string; created_at: string }): Target {
  return {
    userId: p.id,
    createdAt: p.created_at,
    kind: "activate_candidate",
    subject: "Activez votre profil pour être visible · J'ai ma nounou",
    titre: "Votre profil n'est pas encore visible",
    message:
      "Activez votre profil pour apparaître auprès des employeurs, postuler sans limite et " +
      "obtenir le badge « profil actif ». C'est rapide et sécurisé.",
    ctaLabel: "Activer mon profil",
    ctaUrl: `${appUrl()}/app/paiement`,
  };
}

function activatePremiumTarget(p: { id: string; created_at: string }): Target {
  return {
    userId: p.id,
    createdAt: p.created_at,
    kind: "activate_premium",
    subject: "Passez premium pour recruter plus vite · J'ai ma nounou",
    titre: "Débloquez l'accès premium",
    message:
      "Passez à l'accès premium pour contacter les candidates sans limite et recruter plus " +
      "rapidement la personne qu'il vous faut.",
    ctaLabel: "Passer premium",
    ctaUrl: `${appUrl()}/app/paiement`,
  };
}

// ---------------------------------------------------------------------------
// Sélection des segments
// ---------------------------------------------------------------------------

/** A. Inscription incomplète : rôle non choisi OU champs de base manquants. */
async function selectIncompleteProfiles(admin: Admin): Promise<Target[]> {
  const { data } = await admin
    .from("profiles")
    .select("id, created_at, role, prenom, nom, ville")
    .eq("email_opt_out", false)
    .eq("is_suspended", false)
    .is("deleted_at", null)
    .or("role.is.null,prenom.is.null,nom.is.null,ville.is.null")
    .limit(MAX_PER_RUN);

  return (data ?? [])
    .filter((p) => p.role !== "admin") // jamais relancer un admin
    .map((p) => completeProfileTarget(p));
}

/** B. Candidat non payé (= « compte non vérifié ») : rôle candidate, profil de base complet, activation non faite. */
async function selectUnpaidCandidates(admin: Admin, exclude: Set<string>): Promise<Target[]> {
  const { data: unpaid } = await admin
    .from("candidate_profiles")
    .select("user_id")
    .eq("is_active_paid", false)
    .limit(MAX_PER_RUN);

  const ids = (unpaid ?? []).map((r) => r.user_id).filter((id) => !exclude.has(id));
  if (ids.length === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, created_at, prenom, nom, ville")
    .in("id", ids)
    .eq("role", "candidate")
    .eq("email_opt_out", false)
    .eq("is_suspended", false)
    .is("deleted_at", null);

  return (profiles ?? [])
    // Profil de base complet : sinon c'est la relance « complète ton profil » qui prime (segment A).
    .filter((p) => !!p.prenom && !!p.nom && !!p.ville)
    .map((p) => activateCandidateTarget(p));
}

/** C. Employeur non premium : rôle employer, profil de base complet, accès premium non pris. */
async function selectNonPremiumEmployers(admin: Admin, exclude: Set<string>): Promise<Target[]> {
  const { data: nonPremium } = await admin
    .from("employer_profiles")
    .select("user_id")
    .eq("is_premium", false)
    .limit(MAX_PER_RUN);

  const ids = (nonPremium ?? []).map((r) => r.user_id).filter((id) => !exclude.has(id));
  if (ids.length === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, created_at, prenom, nom, ville")
    .in("id", ids)
    .eq("role", "employer")
    .eq("email_opt_out", false)
    .eq("is_suspended", false)
    .is("deleted_at", null);

  return (profiles ?? [])
    .filter((p) => !!p.prenom && !!p.nom && !!p.ville)
    .map((p) => activatePremiumTarget(p));
}

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

export type RelancesResult = {
  sent: number;
  skipped: number;
  byKind: Record<Kind, number>;
};

/**
 * Parcourt les deux segments et envoie AU PLUS un e-mail par utilisateur et par exécution,
 * uniquement si le palier du jour (J+0/1/3/7) n'a pas déjà été envoyé. Les paliers plus
 * anciens sont marqués « faits » pour ne jamais être rattrapés (un seul e-mail de rattrapage
 * pour les comptes déjà anciens).
 */
export async function runRelances(admin: Admin): Promise<RelancesResult> {
  const incomplete = await selectIncompleteProfiles(admin);
  const handled = new Set(incomplete.map((t) => t.userId));
  const unpaidCandidates = await selectUnpaidCandidates(admin, handled);
  const nonPremiumEmployers = await selectNonPremiumEmployers(admin, handled);
  const targets = [...incomplete, ...unpaidCandidates, ...nonPremiumEmployers];

  // Historique existant (table interne, petit volume) → carte des paliers déjà envoyés.
  const { data: sentRows } = await admin.from("email_reminders").select("user_id, kind, step");
  const sentMap = new Map<string, Set<number>>();
  for (const r of sentRows ?? []) {
    const key = `${r.user_id}:${r.kind}`;
    (sentMap.get(key) ?? sentMap.set(key, new Set()).get(key)!).add(r.step);
  }

  const now = Date.now();
  const result: RelancesResult = {
    sent: 0,
    skipped: 0,
    byKind: { complete_profile: 0, activate_candidate: 0, activate_premium: 0 },
  };

  for (const target of targets) {
    const days = Math.floor((now - new Date(target.createdAt).getTime()) / DAY_MS);
    const step = currentStep(days);
    if (step === null) {
      result.skipped++;
      continue;
    }
    const key = `${target.userId}:${target.kind}`;
    const already = sentMap.get(key) ?? new Set<number>();
    if (already.has(step)) {
      result.skipped++;
      continue; // palier du jour déjà traité
    }

    // Adresse e-mail (stockée côté auth, pas dans profiles).
    const { data: userData } = await admin.auth.admin.getUserById(target.userId);
    const email = userData?.user?.email;
    if (!email) {
      result.skipped++;
      continue; // pas d'e-mail : on ne marque rien (réessai possible plus tard)
    }

    try {
      await sendEmail(email, target.subject, relanceHtml(target.titre, target.message, target.ctaLabel, target.ctaUrl, target.userId));
    } catch (e) {
      console.error(`[relances] envoi échoué (${target.kind}, ${target.userId}):`, e);
      result.skipped++;
      continue; // on ne marque pas → l'e-mail sera retenté au prochain passage
    }

    // Marque le palier envoyé + « saute » les paliers antérieurs non envoyés (pas de rattrapage).
    const toMark = STEPS.filter((s) => s <= step && !already.has(s)).map((s) => ({
      user_id: target.userId,
      kind: target.kind,
      step: s,
    }));
    await admin.from("email_reminders").upsert(toMark, { onConflict: "user_id,kind,step", ignoreDuplicates: true });

    result.sent++;
    result.byKind[target.kind]++;
  }

  return result;
}
