export const metadata = { title: "FAQ" };

const FAQ = [
  {
    q: "L'inscription est-elle gratuite ?",
    a: "Oui. Créer un compte et un profil est gratuit. Seules certaines fonctionnalités (activation du profil candidate, accès premium employeur) sont payantes.",
  },
  {
    q: "Comment fonctionne la vérification ?",
    a: "Chaque compte est vérifié par SMS (numéro de téléphone). Des niveaux de vérification supplémentaires seront ajoutés pour renforcer la confiance.",
  },
  {
    q: "Comment se fait le paiement ?",
    a: "Par Mobile Money : Orange Money, MTN MoMo, Moov Money ou Wave. Le paiement est sécurisé et vous recevez une confirmation.",
  },
  {
    q: "Puis-je signaler un comportement suspect ?",
    a: "Oui, un bouton de signalement est disponible sur chaque profil. Notre équipe examine chaque signalement.",
  },
  {
    q: "Dans quelles villes êtes-vous disponibles ?",
    a: "Partout en Côte d'Ivoire. La plateforme est pensée mobile d'abord, adaptée aux connexions lentes.",
  },
];

export default function FaqPage() {
  return (
    <div className="container max-w-2xl py-14">
      <h1 className="text-3xl font-extrabold md:text-4xl">Questions fréquentes</h1>
      <div className="mt-8 space-y-4">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-border bg-card p-5"
          >
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              {item.q}
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
