import { LegalProse } from "@/components/brand/legal-prose";

export const metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalProse title="Conditions générales d'utilisation" updated="1er septembre 2026">
      <section>
        <h2>1. Objet</h2>
        <p>
          « J&apos;ai ma nounou » est une plateforme de mise en relation entre des
          familles/particuliers et des aides à domicile en Côte d&apos;Ivoire. La plateforme
          facilite la mise en relation mais n&apos;est pas l&apos;employeur des candidates.
        </p>
      </section>
      <section>
        <h2>2. Inscription</h2>
        <p>
          L&apos;inscription nécessite un numéro de téléphone valide vérifié par SMS. Vous vous
          engagez à fournir des informations exactes et à ne pas usurper l&apos;identité d&apos;autrui.
        </p>
      </section>
      <section>
        <h2>3. Paiements</h2>
        <p>
          Certaines fonctionnalités sont payantes (activation du profil candidate, accès premium
          employeur), réglées par Mobile Money. Les tarifs sont affichés avant paiement.
        </p>
      </section>
      <section>
        <h2>4. Comportement des utilisateurs</h2>
        <p>
          Tout comportement frauduleux, harcèlement ou fausse information peut entraîner la
          suspension du compte. Un système de signalement est à votre disposition.
        </p>
      </section>
      <section>
        <h2>5. Responsabilité</h2>
        <p>
          La plateforme met en œuvre des mesures de confiance (vérification, notation, signalement)
          mais ne peut garantir le comportement des utilisateurs. Chaque partie reste responsable
          de ses engagements.
        </p>
      </section>
      <p className="text-xs">
        Ce document est un modèle et doit faire l&apos;objet d&apos;une relecture juridique avant
        mise en production.
      </p>
    </LegalProse>
  );
}
