import { UserPlus, ShieldCheck, Lock } from "lucide-react";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateAdminForm } from "@/features/admin/create-admin-form";
import { StaffPermissions } from "@/features/admin/staff-permissions";
import { UserActions } from "@/features/admin/user-actions";
import { formatPhoneCi } from "@/lib/utils";

export const metadata = { title: "Admin — Administrateurs" };

export default async function AdminAdminsPage() {
  const me = await requireSuperAdmin();
  const supabase = await createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, prenom, nom, phone, photo_url, is_super_admin, staff_permissions, is_suspended")
    .eq("role", "admin")
    .order("is_super_admin", { ascending: false })
    .order("created_at", { ascending: true });

  const list = admins ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Administrateurs</h1>
        <p className="text-sm text-muted-foreground">
          Créez des membres du staff et définissez précisément leurs accès. Vous êtes le Super Admin.
        </p>
      </div>

      {/* Création */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><UserPlus className="size-5" /></span>
            <div>
              <h2 className="font-bold">Ajouter un administrateur</h2>
              <p className="text-xs text-muted-foreground">Le compte se connecte par téléphone (OTP). Vous lui attribuez ensuite ses permissions.</p>
            </div>
          </div>
          <CreateAdminForm />
        </CardContent>
      </Card>

      {/* Liste */}
      <div className="space-y-4">
        <h2 className="font-bold">Comptes administrateurs ({list.length})</h2>
        {list.map((a) => {
          const name = `${a.prenom ?? ""} ${a.nom ?? ""}`.trim() || "Administrateur";
          return (
            <Card key={a.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <Avatar src={a.photo_url} nom={a.nom} prenom={a.prenom} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{formatPhoneCi(a.phone)}</p>
                  </div>
                  {a.is_super_admin ? (
                    <Badge className="bg-amber-100 text-amber-800"><ShieldCheck className="size-3" /> Super Admin</Badge>
                  ) : (
                    <Badge className="bg-primary-soft text-primary">Staff</Badge>
                  )}
                  {a.is_suspended && <Badge className="bg-red-100 text-red-700">Suspendu</Badge>}
                </div>

                {a.is_super_admin ? (
                  <p className="inline-flex items-center gap-1.5 rounded-2xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" /> Compte protégé : ne peut être ni modifié, ni suspendu, ni supprimé.
                  </p>
                ) : (
                  <>
                    <div className="border-t border-border/60 pt-4">
                      <StaffPermissions userId={a.id} initial={a.staff_permissions ?? []} />
                    </div>
                    {a.id !== me.id && (
                      <div className="border-t border-border/60 pt-4">
                        <UserActions
                          userId={a.id}
                          name={name}
                          role="admin"
                          suspended={a.is_suspended}
                          hasSubscription={false}
                          subscription={null}
                          isSuperAdmin
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
