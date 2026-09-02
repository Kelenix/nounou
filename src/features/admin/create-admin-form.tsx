"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function CreateAdminForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (prenom.trim().length < 2 || nom.trim().length < 2) {
      toast("Renseignez le prénom et le nom.", "error");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom: prenom.trim(), nom: nom.trim(), phone }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      toast(data?.error ?? "Création impossible.", "error");
      return;
    }
    toast(data?.promoted ? "Compte existant promu administrateur" : "Administrateur créé", "success");
    setPrenom("");
    setNom("");
    setPhone("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="a-prenom">Prénom</Label>
          <Input id="a-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-nom">Nom</Label>
          <Input id="a-nom" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="a-phone">Numéro de téléphone</Label>
        <div className="flex items-center gap-2">
          <span className="flex h-11 items-center rounded-2xl border border-input bg-secondary px-3 text-sm font-medium text-muted-foreground">+225</span>
          <Input id="a-phone" inputMode="numeric" placeholder="07 00 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">
          Le nouvel administrateur se connecte avec ce numéro (OTP). Si un compte existe déjà avec
          ce numéro, il est promu administrateur.
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : <><UserPlus className="size-4" /> Créer l&apos;administrateur</>}
      </Button>
    </form>
  );
}
