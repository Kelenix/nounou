import Link from "next/link";
import { PlusCircle, Inbox } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { OfferCard } from "@/features/offers/offer-card";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("offres.myOffersTitle") };
}

const PAGE_SIZE = 12;
type SP = Record<string, string | string[] | undefined>;

export default async function MesOffresPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const profile = await requireRole("employer");
  const supabase = await createClient();
  const t = await getTranslations();
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  const from = (page - 1) * PAGE_SIZE;
  const { data: offers, count } = await supabase
    .from("offers")
    .select("*", { count: "exact" })
    .eq("employer_id", profile.id)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const { count: activeCount } = await supabase
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("employer_id", profile.id)
    .eq("status", "active");

  const list = offers ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("offres.myOffersTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("offres.myOffersCount", { count: total, active: activeCount ?? 0 })}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/app/offres/nouvelle"><PlusCircle className="size-4" /> {t("offres.publish")}</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Inbox className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">
              {t("offres.noneYet")}
            </p>
            <Button asChild>
              <Link href="/app/offres/nouvelle">{t("offres.publishFirst")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((o) => (
              <div key={o.id} className="relative">
                <OfferCard offer={o} />
                {o.status === "active" && (
                  <Badge className="absolute right-3 top-3 bg-primary-soft text-primary">{t("offres.active")}</Badge>
                )}
              </div>
            ))}
          </div>
          <Pagination basePath="/app/offres" page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
