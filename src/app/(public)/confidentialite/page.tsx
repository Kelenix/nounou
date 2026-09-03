import { getLocale, getTranslations } from "next-intl/server";
import { LegalProse } from "@/components/brand/legal-prose";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("legal.privacyMetaTitle") };
}

export default async function ConfidentialitePage() {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <LegalProse title={t("legal.privacyTitle")} updated={t("legal.privacyUpdated")}>
      {locale === "en" ? <PrivacyEn /> : <PrivacyFr />}
    </LegalProse>
  );
}

function PrivacyFr() {
  return (
    <>
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est « J&apos;ai ma nounou », entreprise
          individuelle exploitée en Côte d&apos;Ivoire et exerçant en ligne.
          Contact : <a href="mailto:lionelkelenix@gmail.com">lionelkelenix@gmail.com</a>.
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
          <li><strong>Supabase</strong> — hébergement de la base de données, authentification (envoi des codes de vérification OTP par SMS) et stockage des photos.</li>
          <li><strong>Stripe, Djamo, PayDunya</strong> — prestataires de paiement (Mobile Money et carte bancaire).</li>
          <li><strong>Hostinger</strong> — hébergement et diffusion de l&apos;application (VPS, serveur Nginx).</li>
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
          nous écrire à <a href="mailto:lionelkelenix@gmail.com">lionelkelenix@gmail.com</a>. Vous pouvez
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
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <section>
        <h2>1. Data controller</h2>
        <p>
          The data controller is &quot;J&apos;ai ma nounou&quot;, a sole proprietorship operating
          online in Côte d&apos;Ivoire. Contact: <a href="mailto:lionelkelenix@gmail.com">lionelkelenix@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>2. Data we collect</h2>
        <p>We collect only the data necessary for the service:</p>
        <ul>
          <li><strong>Identity &amp; contact</strong>: phone number, last name, first name, profile photo (optional).</li>
          <li><strong>Declared location</strong>: city, district/neighborhood.</li>
          <li><strong>Profile data</strong>: for candidates (services, experience, skills, availability, desired salary); for employers (type of need, household, posted offers).</li>
          <li><strong>Activity</strong>: applications, favorites, internal messages, ratings and reports.</li>
          <li><strong>Payments</strong>: amount, method (Mobile Money), reference and transaction status. We do not store any full banking data.</li>
          <li><strong>Technical data</strong>: connection and security logs strictly necessary.</li>
        </ul>
        <p>
          An email address is not required today; if it is added later, this policy will be updated
          accordingly.
        </p>
      </section>

      <section>
        <h2>3. Purposes and legal bases</h2>
        <ul>
          <li><strong>Providing the connection service</strong> (account creation, profiles, offers, applications, messaging) — performance of the contract.</li>
          <li><strong>SMS OTP authentication</strong> and account security — performance of the contract and legitimate interest.</li>
          <li><strong>Payments</strong> (candidate activation, employer premium) — performance of the contract.</li>
          <li><strong>Notifications</strong> related to your activity — performance of the contract / legitimate interest.</li>
          <li><strong>Moderation</strong> (reports, suspensions, audit log) — legitimate interest and legal obligations.</li>
        </ul>
      </section>

      <section>
        <h2>4. Who can see your data</h2>
        <p>
          Your last name, first name, photo, city/district and professional profile information are
          visible to other users as part of the connection service.
          <strong> Your phone number is never displayed publicly</strong>: it is revealed only to a
          signed-in user viewing a profile to make contact, and these views are logged and capped to
          prevent abuse.
        </p>
      </section>

      <section>
        <h2>5. Processors and hosting</h2>
        <p>We rely on technical providers acting on our behalf:</p>
        <ul>
          <li><strong>Supabase</strong> — database hosting, authentication (sending OTP verification codes by SMS) and photo storage.</li>
          <li><strong>Stripe, Djamo, PayDunya</strong> — payment providers (Mobile Money and bank card).</li>
          <li><strong>Hostinger</strong> — application hosting and delivery (VPS, Nginx server).</li>
        </ul>
        <p>We do not sell your data and do not share it for advertising purposes.</p>
      </section>

      <section>
        <h2>6. Retention periods</h2>
        <ul>
          <li>Account and profile: for the duration of use, then deletion on request or after a prolonged period of inactivity.</li>
          <li>Messages, applications, offers: as long as necessary for the service, then archiving/deletion.</li>
          <li>Payment transactions: retained for applicable accounting and legal obligations.</li>
          <li>Security and audit logs: limited duration for security purposes.</li>
        </ul>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          Data access is restricted at the database level (Row Level Security): each user accesses only
          their own data, and administration roles are strictly controlled and logged. Exchanges are
          encrypted in transit (HTTPS).
        </p>
      </section>

      <section>
        <h2>8. Your rights</h2>
        <p>
          In accordance with the regulations applicable in Côte d&apos;Ivoire (Law No. 2013-450 on the
          protection of personal data) and the principles of the GDPR, you have the rights of access,
          rectification, erasure, restriction and objection. You can delete your own account from your
          settings, or write to us at <a href="mailto:lionelkelenix@gmail.com">lionelkelenix@gmail.com</a>. You may
          also refer the matter to the competent data protection authority (ARTCI).
        </p>
      </section>

      <section>
        <h2>9. Minors</h2>
        <p>
          The service is reserved for adults. We do not knowingly collect data concerning minors.
        </p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p>
          This policy may be updated. The last-updated date appears at the top of the page; significant
          changes will be brought to your attention.
        </p>
      </section>

      <p className="text-xs">
        This document is a template to be completed (items in brackets) and
        <strong> must undergo legal review</strong> before going into production.
      </p>
    </>
  );
}
