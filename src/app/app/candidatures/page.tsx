import Link from "next/link";
import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  CandidateApplicationItem,
  type CandidateApplication,
} from "@/features/applications/candidate-application-item";
import {
  EmployerApplicationItem,
  type EmployerApplication,
} from "@/features/applications/employer-application-item";
import type { OfferRow, PublicProfileRow } from "@/lib/supabase/database.types";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("applications.metaTitle") };
}

const CAND_PAGE_SIZE = 12;
const EMP_OFFERS_PER_PAGE = 5;
type SP = Record<string, string | string[] | undefined>;

export default async function CandidaturesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const t = await getTranslations();
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  // ---------------- Candidate : mes candidatures (paginées) ----------------
  if (profile.role === "candidate") {
    const from = (page - 1) * CAND_PAGE_SIZE;
    const { data: apps, count } = await supabase
      .from("applications")
      .select("id, status, offer_id", { count: "exact" })
      .eq("candidate_id", profile.id)
      .order("created_at", { ascending: false })
      .range(from, from + CAND_PAGE_SIZE - 1);

    const rows = apps ?? [];
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / CAND_PAGE_SIZE));

    const offerIds = rows.map((a) => a.offer_id);
    const offersById = new Map<string, OfferRow>();
    if (offerIds.length > 0) {
      const { data: offers } = await supabase.from("offers").select("*").in("id", offerIds);
      for (const o of offers ?? []) offersById.set(o.id, o);
    }

    // Notation employeur : noms + notes déjà données (pour les candidatures acceptées).
    const employerIds = Array.from(
      new Set(rows.filter((a) => a.status === "acceptee").map((a) => offersById.get(a.offer_id)?.employer_id).filter(Boolean) as string[]),
    );
    const employerNames = new Map<string, string>();
    const ratedEmployers = new Set<string>();
    if (employerIds.length > 0) {
      const { data: emps } = await supabase.from("public_profiles").select("id, prenom, nom").in("id", employerIds);
      for (const e of emps ?? []) employerNames.set(e.id, `${e.prenom ?? ""} ${e.nom ?? ""}`.trim() || t("applications.defaultEmployer"));
      const { data: rated } = await supabase
        .from("ratings")
        .select("to_user")
        .eq("from_user", profile.id)
        .eq("role_context", "candidate_rates_employer")
        .in("to_user", employerIds);
      for (const r of rated ?? []) ratedEmployers.add(r.to_user);
    }

    const items: CandidateApplication[] = rows.map((a) => {
      const o = offersById.get(a.offer_id);
      return {
        id: a.id,
        status: a.status,
        offer: o
          ? { id: o.id, titre: o.titre, type_service: o.type_service, ville: o.ville, commune: o.commune }
          : null,
        rating:
          a.status === "acceptee" && o
            ? {
                candidateId: profile.id,
                employerId: o.employer_id,
                employerName: employerNames.get(o.employer_id) ?? t("applications.defaultEmployer"),
                alreadyRated: ratedEmployers.has(o.employer_id),
              }
            : null,
      };
    });

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("applications.myApplications")}</h1>
        {items.length === 0 ? (
          <Empty label={t("applications.empty")} href="/app/recherche" cta={t("applications.seeOffers")} />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((it) => <CandidateApplicationItem key={it.id} application={it} />)}
            </div>
            <Pagination basePath="/app/candidatures" page={page} totalPages={totalPages} />
          </>
        )}
      </div>
    );
  }

  // ---------------- Employeur : candidatures reçues (paginées par offre) ----------------
  const { data: myOffers } = await supabase
    .from("offers")
    .select("id, titre")
    .eq("employer_id", profile.id);
  const offerTitle = new Map((myOffers ?? []).map((o) => [o.id, o.titre]));
  const offerIds = (myOffers ?? []).map((o) => o.id);

  let grouped: { offerId: string; title: string; apps: EmployerApplication[] }[] = [];
  if (offerIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, status, message, candidate_id, offer_id")
      .in("offer_id", offerIds)
      .order("created_at", { ascending: false });

    const rows = apps ?? [];
    const candIds = rows.map((a) => a.candidate_id);
    const candById = new Map<string, PublicProfileRow>();
    if (candIds.length > 0) {
      const { data: cands } = await supabase
        .from("public_profiles")
        .select("id, nom, prenom, photo_url, ville, commune, role, verification_level, is_active, is_suspended, created_at")
        .in("id", candIds);
      for (const c of cands ?? []) candById.set(c.id, c);
    }

    const byOffer = new Map<string, EmployerApplication[]>();
    for (const a of rows) {
      const list = byOffer.get(a.offer_id) ?? [];
      list.push({
        id: a.id,
        status: a.status,
        message: a.message,
        candidate: candById.get(a.candidate_id) ?? null,
      });
      byOffer.set(a.offer_id, list);
    }
    grouped = Array.from(byOffer.entries()).map(([offerId, appsList]) => ({
      offerId,
      title: offerTitle.get(offerId) ?? t("applications.offerFallback"),
      apps: appsList,
    }));
  }

  const total = grouped.reduce((n, g) => n + g.apps.length, 0);
  const totalPages = Math.max(1, Math.ceil(grouped.length / EMP_OFFERS_PER_PAGE));
  const pageGroups = grouped.slice((page - 1) * EMP_OFFERS_PER_PAGE, page * EMP_OFFERS_PER_PAGE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("applications.receivedTitle")}</h1>
      {total === 0 ? (
        <Empty label={t("applications.emptyReceived")} href="/app/offres/nouvelle" cta={t("applications.postOffer")} />
      ) : (
        <>
          <div className="space-y-6">
            {pageGroups.map((g) => (
              <section key={g.offerId}>
                <Link href={`/app/offres/${g.offerId}`} className="mb-2 block text-sm font-semibold text-primary">
                  {g.title} ({g.apps.length})
                </Link>
                <div className="space-y-3">
                  {g.apps.map((a) => <EmployerApplicationItem key={a.id} application={a} />)}
                </div>
              </section>
            ))}
          </div>
          <Pagination basePath="/app/candidatures" page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

function Empty({ label, href, cta }: { label: string; href: string; cta: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <FileText className="size-7" />
        </span>
        <p className="text-sm text-muted-foreground">{label}</p>
        <Link href={href} className="text-sm font-semibold text-primary">{cta}</Link>
      </CardContent>
    </Card>
  );
}
