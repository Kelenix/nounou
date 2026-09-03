import { getLocale, getTranslations } from "next-intl/server";
import { LegalProse } from "@/components/brand/legal-prose";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("legal.cguMetaTitle") };
}

export default async function CguPage() {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <LegalProse title={t("legal.cguTitle")} updated={t("legal.cguUpdated")}>
      {locale === "en" ? <CguEn /> : <CguFr />}
    </LegalProse>
  );
}

function CguFr() {
  return (
    <>
      <section>
        <h2>1. Objet</h2>
        <p>
          « J&apos;ai ma nounou » est une plateforme de mise en relation entre des
          familles/particuliers et des aides à domicile (nounous, ménage, cuisine, garde
          d&apos;enfants…) en Côte d&apos;Ivoire. La plateforme facilite la mise en relation mais
          <strong> n&apos;est pas l&apos;employeur des candidates</strong> et n&apos;est pas partie
          au contrat de travail éventuellement conclu entre les utilisateurs.
        </p>
      </section>

      <section>
        <h2>2. Éditeur</h2>
        <p>
          Le service est édité par [Raison sociale], [forme juridique], siège à [adresse],
          Côte d&apos;Ivoire. Contact : <a href="mailto:[email de contact]">[email de contact]</a>.
        </p>
      </section>

      <section>
        <h2>3. Inscription et compte</h2>
        <p>
          L&apos;inscription nécessite un numéro de téléphone valide vérifié par SMS (OTP). Vous vous
          engagez à fournir des informations exactes, à ne pas usurper l&apos;identité d&apos;autrui
          et à garder votre accès confidentiel. Le service est réservé aux personnes majeures.
        </p>
      </section>

      <section>
        <h2>4. Rôles et fonctionnement</h2>
        <p>
          Les employeurs publient des offres et contactent des candidates ; les candidates créent un
          profil et postulent. La mise en relation, les échanges et tout accord relèvent de la
          responsabilité des utilisateurs concernés.
        </p>
      </section>

      <section>
        <h2>5. Paiements</h2>
        <p>
          Certaines fonctionnalités sont payantes (activation du profil candidate, accès premium
          employeur), réglées par Mobile Money. Les tarifs applicables sont affichés avant tout
          paiement. Sauf disposition légale contraire, les sommes versées pour un service déjà rendu
          ne sont pas remboursables.
        </p>
      </section>

      <section>
        <h2>6. Engagements des utilisateurs</h2>
        <ul>
          <li>Fournir des informations exactes et à jour.</li>
          <li>Ne pas harceler, frauder, diffuser de fausses informations ni publier de contenu illicite.</li>
          <li>Utiliser la messagerie et les contacts uniquement dans le cadre du service.</li>
          <li>Respecter la législation du travail applicable en cas d&apos;embauche.</li>
        </ul>
        <p>
          Tout manquement peut entraîner la suspension ou la suppression du compte. Un système de
          signalement est à votre disposition.
        </p>
      </section>

      <section>
        <h2>7. Contenus et données</h2>
        <p>
          Vous restez responsable des contenus que vous publiez (profil, offres, messages). Le
          traitement de vos données personnelles est décrit dans notre{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </section>

      <section>
        <h2>8. Responsabilité</h2>
        <p>
          La plateforme met en œuvre des mesures de confiance (vérification du téléphone, notation,
          signalement, modération) mais ne garantit pas le comportement des utilisateurs ni la
          conclusion ou la bonne exécution d&apos;un engagement entre eux. Le service est fourni « en
          l&apos;état » ; notre responsabilité est limitée dans les conditions prévues par la loi.
        </p>
      </section>

      <section>
        <h2>9. Suspension et résiliation</h2>
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis vos paramètres. Nous pouvons
          suspendre un compte en cas de violation des présentes conditions ou d&apos;usage abusif.
        </p>
      </section>

      <section>
        <h2>10. Modifications et droit applicable</h2>
        <p>
          Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de la page. Elles
          sont régies par le droit ivoirien, les tribunaux compétents étant ceux du ressort du siège
          de l&apos;éditeur, sous réserve des dispositions légales impératives.
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

function CguEn() {
  return (
    <>
      <section>
        <h2>1. Purpose</h2>
        <p>
          &quot;J&apos;ai ma nounou&quot; is a platform connecting families/individuals with home-help
          providers (nannies, cleaning, cooking, childcare…) in Côte d&apos;Ivoire. The platform
          facilitates connections but <strong>is not the employer of candidates</strong> and is not a
          party to any employment contract concluded between users.
        </p>
      </section>

      <section>
        <h2>2. Publisher</h2>
        <p>
          The service is published by [Company name], [legal form], headquartered at [address],
          Côte d&apos;Ivoire. Contact: <a href="mailto:[contact email]">[contact email]</a>.
        </p>
      </section>

      <section>
        <h2>3. Registration and account</h2>
        <p>
          Registration requires a valid phone number verified by SMS (OTP). You agree to provide
          accurate information, not to impersonate others, and to keep your access confidential. The
          service is reserved for adults.
        </p>
      </section>

      <section>
        <h2>4. Roles and operation</h2>
        <p>
          Employers post offers and contact candidates; candidates create a profile and apply. The
          connection, exchanges and any agreement are the responsibility of the users concerned.
        </p>
      </section>

      <section>
        <h2>5. Payments</h2>
        <p>
          Some features are paid (candidate profile activation, employer premium access), settled by
          Mobile Money. Applicable prices are shown before any payment. Unless otherwise required by
          law, amounts paid for a service already rendered are non-refundable.
        </p>
      </section>

      <section>
        <h2>6. User commitments</h2>
        <ul>
          <li>Provide accurate and up-to-date information.</li>
          <li>Do not harass, defraud, spread false information or publish unlawful content.</li>
          <li>Use messaging and contacts only within the scope of the service.</li>
          <li>Comply with applicable labor law when hiring.</li>
        </ul>
        <p>
          Any breach may lead to suspension or deletion of the account. A reporting system is
          available to you.
        </p>
      </section>

      <section>
        <h2>7. Content and data</h2>
        <p>
          You remain responsible for the content you publish (profile, offers, messages). The
          processing of your personal data is described in our{" "}
          <a href="/confidentialite">privacy policy</a>.
        </p>
      </section>

      <section>
        <h2>8. Liability</h2>
        <p>
          The platform implements trust measures (phone verification, ratings, reporting, moderation)
          but does not guarantee the behavior of users nor the conclusion or proper performance of any
          commitment between them. The service is provided &quot;as is&quot;; our liability is limited
          as provided by law.
        </p>
      </section>

      <section>
        <h2>9. Suspension and termination</h2>
        <p>
          You may delete your account at any time from your settings. We may suspend an account in the
          event of a breach of these terms or abusive use.
        </p>
      </section>

      <section>
        <h2>10. Changes and governing law</h2>
        <p>
          These terms may change; the update date appears at the top of the page. They are governed by
          Ivorian law, with the competent courts being those of the publisher&apos;s registered office,
          subject to mandatory legal provisions.
        </p>
      </section>

      <p className="text-xs">
        This document is a template to be completed (items in brackets) and
        <strong> must undergo legal review</strong> before going into production.
      </p>
    </>
  );
}
