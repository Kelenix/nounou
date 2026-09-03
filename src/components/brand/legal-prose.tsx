import { getTranslations } from "next-intl/server";

export async function LegalProse({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations();
  return (
    <div className="container max-w-2xl py-14">
      <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("legal.updated")} : {updated}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_p]:text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
