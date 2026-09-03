import { LegalProse } from "@/components/brand/legal-prose";

export const metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalProse title="Conditions générales d'utilisation" updated="3 septembre 2026">
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
    </LegalProse>
  );
}
