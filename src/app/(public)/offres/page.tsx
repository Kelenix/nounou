import Link from "next/link";
import { Suspense } from "react";
import { SearchX, ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { OfferCard } from "@/features/offers/offer-card";
import { Pagination } from "@/components/ui/pagination";
import { SearchFilters } from "@/features/search/search-filters";
import type { ServiceType } from "@/lib/supabase/database.types";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("offres.title") };
}

type SP = Record<string, string | string[] | undefined>;

export default async function OffresPubliquesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const ville = get("ville");
  const service = get("service") as ServiceType | "";
  const salaireMin = get("salaireMax");

  const page = Math.max(1, Number(get("page")) || 1);
  const PAGE_SIZE = 12;
  const supabase = await createClient();
  let q = supabase.from("offers").select("*", { count: "exact" }).eq("status", "active");
  if (ville) q = q.eq("ville", ville);
  if (service) q = q.eq("type_service", service);
  if (salaireMin) q = q.gte("salaire", Number(salaireMin));
  const from = (page - 1) * PAGE_SIZE;
  const { data: offers, count } = await q.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const list = offers ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const linkParams: Record<string, string> = {};
  for (const k of ["service", "ville", "salaireMax"]) if (get(k)) linkParams[k] = get(k);
  const t = await getTranslations();

  return (
    <div className="container py-8 lg:py-12">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("offres.home")}
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {service ? t("offres.titleService", { service: t(`services.${service}`) }) : t("offres.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("offres.count", { count: total })}
        </p>
      </div>

      <div className="mb-6">
        <Suspense fallback={null}>
          <SearchFilters role="candidate" />
        </Suspense>
      </div>

      {list.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((o) => <OfferCard key={o.id} offer={o} basePath="/offres" />)}
          </div>
          <Pagination basePath="/offres" page={page} totalPages={totalPages} params={linkParams} />
        </>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <SearchX className="mx-auto size-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold">{t("offres.empty")}</h2>
          <p className="mt-1 text-muted-foreground">{t("offres.emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
