import { createClient } from "@/lib/supabase/server";
import { requireAdminSection } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { SERVICE_LABELS } from "@/lib/constants";
import { formatFcfa } from "@/lib/utils";

export const metadata = { title: "Admin — Offres" };

const PAGE_SIZE = 15;
type SP = Record<string, string | string[] | undefined>;

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAdminSection("offers");
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data: offers, count } = await supabase
    .from("offers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const list = offers ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Offres ({total})</h1>
      <div className="space-y-2">
        {list.map((o) => (
          <Card key={o.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{o.titre}</p>
                <Badge className={o.status === "active" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}>
                  {o.status === "active" ? "Active" : "Clôturée"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {SERVICE_LABELS[o.type_service]} · {[o.commune, o.ville].filter(Boolean).join(", ")}
                {o.salaire != null ? ` · ${formatFcfa(o.salaire)}` : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination basePath="/admin/offres" page={page} totalPages={totalPages} />
    </div>
  );
}
