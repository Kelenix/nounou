export const metadata = { title: "Comment ça marche" };

const STEPS_EMPLOYEUR = [
  "Créez votre compte par téléphone (code SMS).",
  "Choisissez « Je recherche une personne ».",
  "Publiez une offre : type de service, ville, détails.",
  "Recevez les candidatures et échangez.",
  "Acceptez la bonne candidate, puis notez votre expérience.",
];

const STEPS_CANDIDATE = [
  "Créez votre compte par téléphone (code SMS).",
  "Choisissez « Je recherche un emploi ».",
  "Complétez votre profil : services, expérience, disponibilité.",
  "Parcourez les offres et postulez en un clic.",
  "Suivez vos candidatures et échangez avec les familles.",
];

export default function CommentCaMarchePage() {
  return (
    <div className="container max-w-3xl py-14">
      <h1 className="text-3xl font-extrabold md:text-4xl">Comment ça marche</h1>
      <p className="mt-3 text-muted-foreground">
        Simple, rapide et sécurisé — que vous cherchiez une aide à domicile ou un emploi.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <Column title="Pour les familles / employeurs" steps={STEPS_EMPLOYEUR} />
        <Column title="Pour les candidates" steps={STEPS_CANDIDATE} />
      </div>
    </div>
  );
}

function Column({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section>
      <h2 className="text-xl font-bold">{title}</h2>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {i + 1}
            </span>
            <span className="pt-1 text-sm text-foreground">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
