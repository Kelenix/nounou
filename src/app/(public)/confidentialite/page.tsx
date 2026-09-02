import { LegalProse } from "@/components/brand/legal-prose";

export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalProse title="Politique de confidentialité" updated="1er septembre 2026">
      <section>
        <h2>1. Données collectées</h2>
        <p>
          Nous collectons les informations que vous fournissez : numéro de téléphone, nom, prénom,
          photo, ville/commune, ainsi que les données de profil (services, expérience, offres,
          candidatures). Le numéro de téléphone sert à l&apos;authentification.
        </p>
      </section>
      <section>
        <h2>2. Utilisation</h2>
        <p>
          Vos données servent à faire fonctionner la mise en relation, sécuriser les comptes,
          traiter les paiements et vous notifier des événements importants (candidatures, paiements).
        </p>
      </section>
      <section>
        <h2>3. Partage</h2>
        <p>
          Votre nom, photo et informations de profil sont visibles des autres utilisateurs dans le
          cadre de la mise en relation. Votre numéro de téléphone n&apos;est pas exposé publiquement.
        </p>
      </section>
      <section>
        <h2>4. Sécurité</h2>
        <p>
          L&apos;accès aux données est restreint par des règles de sécurité au niveau de la base
          (RLS) : chaque utilisateur n&apos;accède qu&apos;à ses propres données.
        </p>
      </section>
      <section>
        <h2>5. Vos droits</h2>
        <p>
          Vous pouvez accéder à vos données, les corriger ou demander la suppression de votre compte
          en nous contactant.
        </p>
      </section>
      <p className="text-xs">
        Ce document est un modèle et doit faire l&apos;objet d&apos;une relecture juridique avant
        mise en production.
      </p>
    </LegalProse>
  );
}
