import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("faq.metaTitle") };
}

export default async function FaqPage() {
  const t = await getTranslations();
  const faq = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
  ];

  return (
    <div className="container max-w-2xl py-14">
      <h1 className="text-3xl font-extrabold md:text-4xl">{t("faq.title")}</h1>
      <div className="mt-8 space-y-4">
        {faq.map((item) => (
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
