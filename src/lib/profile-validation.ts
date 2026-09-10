/**
 * Validation de l'identité d'un profil (nom/prénom réels + téléphone).
 * Utilisé côté client (UX) ET reflété par un trigger SQL (garde-fou inviolable,
 * cf. migration 20260910000002_profile_identity_guard).
 */

/** Mots/prénoms factices interdits (comparés sur une forme normalisée sans accents). */
const FORBIDDEN_NAMES = new Set([
  "test", "tests", "testtest", "essai", "essaie", "fake", "faux",
  "sansnom", "nom", "prenom", "name", "username", "user", "utilisateur",
  "admin", "root", "idiot", "idio", "azerty", "qwerty", "azer", "qsdf",
  "aaa", "bbb", "ccc", "xxx", "yyy", "zzz", "abc", "abcd", "abcde",
  "toto", "tata", "titi", "tutu", "tete", "login", "demo", "example",
  "exemple", "anonyme", "inconnu", "nobody", "asdf", "asd", "jkl", "qwe",
]);

/** Minuscules, sans accents, uniquement les lettres a-z. */
function normalize(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

/**
 * Nom ou prénom valide : lettres (accents, espace, apostrophe, tiret, point)
 * uniquement, au moins 2 lettres, sans chiffres, pas une répétition d'une
 * même lettre, et aucun mot factice (« test », « sans nom », etc.).
 */
export function isValidName(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (v.length < 2) return false;
  if (/\d/u.test(v)) return false;
  if (!/^[\p{L}][\p{L} .'’-]*$/u.test(v)) return false;

  const whole = normalize(v);
  if (whole.length < 2) return false;
  if (/^(.)\1+$/u.test(whole)) return false; // "aaaa"
  if (FORBIDDEN_NAMES.has(whole)) return false;

  // Chaque mot du segment ne doit pas être un mot factice (« Test Test »).
  for (const word of v.split(/[\s.'’-]+/u).filter(Boolean)) {
    if (FORBIDDEN_NAMES.has(normalize(word))) return false;
  }
  return true;
}

/**
 * Téléphone ivoirien valide : 10 chiffres en local (ex. 0700000000) ou au
 * format stocké 225 + 10 chiffres. Obligatoire (non vide).
 */
export function isValidCiPhone(raw: string | null | undefined): boolean {
  const digits = (raw ?? "").replace(/\D/gu, "");
  return /^\d{10}$/u.test(digits) || /^225\d{10}$/u.test(digits);
}
