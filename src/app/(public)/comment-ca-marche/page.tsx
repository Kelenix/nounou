import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("howItWorks.title") };
}

export default async function CommentCaMarchePage() {
  const t = await getTranslations();
  const stepsEmployeur = [
    t("howItWorks.employer1"),
    t("howItWorks.employer2"),
    t("howItWorks.employer3"),
    t("howItWorks.employer4"),
    t("howItWorks.employer5"),
  ];
  const stepsCandidate = [
    t("howItWorks.candidate1"),
    t("howItWorks.candidate2"),
    t("howItWorks.candidate3"),
    t("howItWorks.candidate4"),
    t("howItWorks.candidate5"),
  ];

  return (
    <div className="container max-w-3xl py-14">
      <h1 className="text-3xl font-extrabold md:text-4xl">{t("howItWorks.title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("howItWorks.subtitle")}</p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <Column title={t("howItWorks.employersTitle")} steps={stepsEmployeur} />
        <Column title={t("howItWorks.candidatesTitle")} steps={stepsCandidate} />
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
