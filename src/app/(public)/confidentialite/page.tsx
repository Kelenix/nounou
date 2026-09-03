import { LegalProse } from "@/components/brand/legal-prose";

export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalProse title="Politique de confidentialité" updated="3 septembre 2026">
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est [Raison sociale de l&apos;éditeur],
          [forme juridique], dont le siège est situé à [adresse], Côte d&apos;Ivoire.
          Contact : <a href="mailto:[email de contact]">[email de contact]</a>.
        </p>
      </section>

      <section>
        <h2>2. Données que nous collectons</h2>
        <p>Nous collectons uniquement les données nécessaires au service :</p>
        <ul>
          <li><strong>Identité &amp; contact</strong> : numéro de téléphone, nom, prénom, photo de profil (facultative).</li>
          <li><strong>Localisation déclarée</strong> : ville, commune/quartier.</li>
          <li><strong>Données de profil</strong> : pour les candidates (services, expérience, compétences, disponibilité, salaire souhaité) ; pour les employeurs (type de besoin, foyer, offres publiées).</li>
          <li><strong>Activité</strong> : candidatures, favoris, messages internes, notes et signalements.</li>
          <li><strong>Paiements</strong> : montant, moyen (Mobile Money), référence et statut de transaction. Nous ne stockons aucune donnée bancaire complète.</li>
          <li><strong>Données techniques</strong> : journaux de connexion et de sécurité strictement nécessaires.</li>
        </ul>
        <p>
          L&apos;adresse e-mail n&apos;est pas requise aujourd&apos;hui ; si elle est ajoutée
          ultérieurement, la présente politique sera mise à jour en conséquence.
        </p>
      </section>

      <section>
        <h2>3. Finalités et bases légales</h2>
        <ul>
          <li><strong>Fournir la mise en relation</strong> (création de compte, profils, offres, candidatures, messagerie) — exécution du contrat.</li>
          <li><strong>Authentification par OTP SMS</strong> et sécurité des comptes — exécution du contrat et intérêt légitime.</li>
          <li><strong>Paiements</strong> (activation candidate, premium employeur) — exécution du contrat.</li>
          <li><strong>Notifications</strong> liées à votre activité — exécution du contrat / intérêt légitime.</li>
          <li><strong>Modération</strong> (signalements, suspensions, journal d&apos;audit) — intérêt légitime et obligations légales.</li>
        </ul>
      </section>

      <section>
        <h2>4. Qui peut voir vos données</h2>
        <p>
          Votre nom, prénom, photo, ville/commune et informations de profil professionnel sont
          visibles des autres utilisateurs dans le cadre de la mise en relation.
          <strong> Votre numéro de téléphone n&apos;est jamais affiché publiquement</strong> : il
          n&apos;est révélé qu&apos;à un utilisateur connecté qui consulte un profil pour prendre
          contact, et ces consultations sont journalisées et plafonnées pour éviter tout abus.
        </p>
      </section>

      <section>
        <h2>5. Sous-traitants et hébergement</h2>
        <p>Nous faisons appel à des prestataires techniques agissant pour notre compte :</p>
        <ul>
          <li><strong>Supabase</strong> — hébergement de la base de données, authentification et stockage des photos.</li>
          <li><strong>[Fournisseur SMS]</strong> — envoi des codes de vérification (OTP).</li>
          <li><strong>[Agrégateur Mobile Money]</strong> — traitement des paiements.</li>
          <li><strong>[Hébergeur / CDN]</strong> — diffusion de l&apos;application.</li>
        </ul>
        <p>Nous ne vendons pas vos données et ne les partageons pas à des fins publicitaires.</p>
      </section>

      <section>
        <h2>6. Durées de conservation</h2>
        <ul>
          <li>Compte et profil : pendant la durée d&apos;utilisation, puis suppression sur demande ou après une période d&apos;inactivité prolongée.</li>
          <li>Messages, candidatures, offres : le temps nécessaire au service, puis archivage/suppression.</li>
          <li>Transactions de paiement : conservées pour les obligations comptables et légales applicables.</li>
          <li>Journaux de sécurité et d&apos;audit : durée limitée à des fins de sécurité.</li>
        </ul>
      </section>

      <section>
        <h2>7. Sécurité</h2>
        <p>
          L&apos;accès aux données est restreint au niveau de la base (Row Level Security) : chaque
          utilisateur n&apos;accède qu&apos;à ses propres données, et les rôles d&apos;administration
          sont strictement contrôlés et journalisés. Les échanges sont chiffrés en transit (HTTPS).
        </p>
      </section>

      <section>
        <h2>8. Vos droits</h2>
        <p>
          Conformément à la réglementation applicable en Côte d&apos;Ivoire (loi n° 2013-450 relative
          à la protection des données à caractère personnel) et aux principes du RGPD, vous disposez
          des droits d&apos;accès, de rectification, d&apos;effacement, de limitation et
          d&apos;opposition. Vous pouvez supprimer vous-même votre compte depuis vos paramètres, ou
          nous écrire à <a href="mailto:[email de contact]">[email de contact]</a>. Vous pouvez
          également saisir l&apos;autorité de protection des données compétente (ARTCI).
        </p>
      </section>

      <section>
        <h2>9. Mineurs</h2>
        <p>
          Le service est réservé aux personnes majeures. Nous ne collectons pas sciemment de données
          concernant des mineurs.
        </p>
      </section>

      <section>
        <h2>10. Modifications</h2>
        <p>
          Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de la
          page ; les changements importants vous seront signalés.
        </p>
      </section>

      <p className="text-xs">
        Ce document est un modèle destiné à être complété (mentions entre crochets) et
        <strong> doit faire l&apos;objet d&apos;une relecture juridique</strong> avant mise en
        production.
      </p>
    </LegalProse>
  );
}
