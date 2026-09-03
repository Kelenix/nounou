import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CatalogFilters } from "@/features/catalog/catalog-filters";
import { ProviderCard } from "@/features/catalog/provider-card";
import { Pagination } from "@/components/ui/pagination";
import { listPublicProviders, type ProviderFilters } from "@/features/catalog/queries";
import type { ServiceType } from "@/lib/supabase/database.types";

const PAGE_SIZE = 12;

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("nounous.title") };
}

type SP = Record<string, string | string[] | undefined>;

export default async function NounousPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const filters: ProviderFilters = {
    service: (get("service") || undefined) as ServiceType | undefined,
    ville: get("ville") || undefined,
    commune: get("commune") || undefined,
    salaireMax: get("salaireMax") ? Number(get("salaireMax")) : undefined,
    tempsPlein: get("tempsPlein") ? get("tempsPlein") === "true" : undefined,
  };

  const all = await listPublicProviders(filters, 200);
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(get("page")) || 1), totalPages);
  const providers = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const t = await getTranslations();
  const serviceLabel = filters.service ? t(`services.${filters.service}`) : null;

  // Paramètres à préserver dans les liens de pagination (hors "page").
  const linkParams: Record<string, string> = {};
  for (const k of ["service", "ville", "commune", "salaireMax", "tempsPlein"]) {
    const v = get(k);
    if (v) linkParams[k] = v;
  }

  return (
    <div className="container py-8 lg:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {serviceLabel ? t("nounous.titleService", { service: serviceLabel }) : t("nounous.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {filters.ville
            ? t("nounous.countCity", { count: total, city: filters.ville })
            : t("nounous.countCountry", { count: total })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Suspense fallback={null}>
            <CatalogFilters />
          </Suspense>
        </aside>

        <div>
          {providers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {providers.map((p) => <ProviderCard key={p.profile.id} item={p} />)}
              </div>
              <Pagination basePath="/nounous" page={page} totalPages={totalPages} params={linkParams} />
            </>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-12 text-center">
              <SearchX className="mx-auto size-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-bold">{t("nounous.empty")}</h2>
              <p className="mt-1 text-muted-foreground">{t("nounous.emptyHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
