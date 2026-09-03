"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ServicePicker } from "@/components/ui/service-picker";
import { useToast } from "@/components/ui/toast";
import { AvatarUpload } from "@/features/profiles/avatar-upload";
import { VILLES_CI, COMMUNES_ABIDJAN } from "@/lib/constants";
import type {
  ProfileRow,
  CandidateProfileRow,
  EmployerProfileRow,
  ServiceType,
} from "@/lib/supabase/database.types";

export function ProfileEditForm({
  profile,
  candidate,
  employer,
}: {
  profile: ProfileRow;
  candidate: CandidateProfileRow | null;
  employer: EmployerProfileRow | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();

  // Un administrateur / membre du staff édite depuis le back-office, pas depuis /app.
  const backHref = profile.role === "admin" ? "/admin" : "/app/profil";

  // Champs communs
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photo_url);
  const [prenom, setPrenom] = useState(profile.prenom ?? "");
  const [nom, setNom] = useState(profile.nom ?? "");
  const [ville, setVille] = useState(profile.ville ?? "Abidjan");
  const [commune, setCommune] = useState(profile.commune ?? "");

  // Candidate
  const [services, setServices] = useState<ServiceType[]>(candidate?.services ?? []);
  const [experience, setExperience] = useState(String(candidate?.experience_annees ?? 0));
  const [competences, setCompetences] = useState((candidate?.competences ?? []).join(", "));
  const [dispo, setDispo] = useState(candidate?.disponibilite ?? "");
  const [tempsPlein, setTempsPlein] = useState(candidate?.temps_plein ?? true);
  const [candDesc, setCandDesc] = useState(candidate?.description ?? "");
  const [salaireSouhaite, setSalaireSouhaite] = useState(
    candidate?.salaire_souhaite != null ? String(candidate.salaire_souhaite) : "",
  );

  // Employer
  const [typeBesoin, setTypeBesoin] = useState(employer?.type_besoin ?? "");
  const [empDesc, setEmpDesc] = useState(employer?.description ?? "");
  const [nbFoyer, setNbFoyer] = useState(
    employer?.nb_personnes_foyer != null ? String(employer.nb_personnes_foyer) : "",
  );
  const [typeLogement, setTypeLogement] = useState(employer?.type_logement ?? "");
  const [horaires, setHoraires] = useState(employer?.horaires ?? "");
  const [salairePropose, setSalairePropose] = useState(
    employer?.salaire_propose != null ? String(employer.salaire_propose) : "",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (prenom.trim().length < 2 || nom.trim().length < 2) {
      setError(t("profileEdit.nameRequired"));
      return;
    }
    setLoading(true);

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        prenom: prenom.trim(),
        nom: nom.trim(),
        ville,
        commune: commune.trim() || null,
        photo_url: photoUrl,
      })
      .eq("id", profile.id);

    let roleErr = null;
    if (profile.role === "candidate") {
      const { error } = await supabase.from("candidate_profiles").upsert({
        user_id: profile.id,
        services,
        experience_annees: Number(experience) || 0,
        competences: competences.split(",").map((c) => c.trim()).filter(Boolean),
        disponibilite: dispo.trim() || null,
        temps_plein: tempsPlein,
        description: candDesc.trim() || null,
        salaire_souhaite: salaireSouhaite ? Number(salaireSouhaite) : null,
      });
      roleErr = error;
    } else if (profile.role === "employer") {
      const { error } = await supabase.from("employer_profiles").upsert({
        user_id: profile.id,
        type_besoin: typeBesoin.trim() || null,
        description: empDesc.trim() || null,
        nb_personnes_foyer: nbFoyer ? Number(nbFoyer) : null,
        type_logement: typeLogement.trim() || null,
        horaires: horaires.trim() || null,
        salaire_propose: salairePropose ? Number(salairePropose) : null,
      });
      roleErr = error;
    }

    setLoading(false);
    if (pErr || roleErr) {
      setError(t("profileEdit.saveFailed"));
      return;
    }
    toast(t("profileEdit.saved"), "success");
    router.push(backHref);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" type="button">
          <Link href={backHref}><ArrowLeft className="size-5" /></Link>
        </Button>
        <h1 className="text-lg font-extrabold">{t("profileEdit.title")}</h1>
      </div>

      <AvatarUpload userId={profile.id} value={photoUrl} nom={nom} prenom={prenom} onChange={setPhotoUrl} />

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("profileEdit.firstName")}><Input value={prenom} onChange={(e) => setPrenom(e.target.value)} /></Field>
        <Field label={t("profileEdit.lastName")}><Input value={nom} onChange={(e) => setNom(e.target.value)} /></Field>
      </div>

      <Field label={t("profileEdit.city")}>
        <Select value={ville} onChange={(e) => setVille(e.target.value)}>
          {VILLES_CI.map((v) => <option key={v} value={v}>{v}</option>)}
        </Select>
      </Field>

      <Field label={t("profileEdit.communeQuartier")}>
        {ville === "Abidjan" ? (
          <Select value={commune} onChange={(e) => setCommune(e.target.value)}>
            <option value="">{t("profileEdit.select")}</option>
            {COMMUNES_ABIDJAN.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        ) : (
          <Input value={commune} onChange={(e) => setCommune(e.target.value)} placeholder={t("profileEdit.communePlaceholder")} />
        )}
      </Field>

      {profile.role === "candidate" && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-bold">{t("profileEdit.candidateInfo")}</h2>
          <Field label={t("profileEdit.servicesOffered")}>
            <ServicePicker value={services} onChange={setServices} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("profileEdit.experienceYears")}>
              <Input type="number" inputMode="numeric" min={0} value={experience} onChange={(e) => setExperience(e.target.value)} />
            </Field>
            <Field label={t("profileEdit.desiredSalary")}>
              <Input type="number" inputMode="numeric" min={0} value={salaireSouhaite} onChange={(e) => setSalaireSouhaite(e.target.value)} placeholder={t("profileEdit.optional")} />
            </Field>
          </div>
          <Field label={t("profileEdit.skills")}>
            <Input value={competences} onChange={(e) => setCompetences(e.target.value)} placeholder={t("profileEdit.skillsPlaceholder")} />
          </Field>
          <Field label={t("profileEdit.availability")}>
            <Input value={dispo} onChange={(e) => setDispo(e.target.value)} placeholder={t("profileEdit.availabilityPlaceholder")} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tempsPlein} onChange={(e) => setTempsPlein(e.target.checked)} className="size-4 accent-primary" />
            {t("profileEdit.fullTimeAvailable")}
          </label>
          <Field label={t("profileEdit.aboutMe")}>
            <Textarea value={candDesc} onChange={(e) => setCandDesc(e.target.value)} placeholder={t("profileEdit.aboutMePlaceholder")} />
          </Field>
        </div>
      )}

      {profile.role === "employer" && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-bold">{t("profileEdit.employerInfo")}</h2>
          <Field label={t("profileEdit.needType")}>
            <Input value={typeBesoin} onChange={(e) => setTypeBesoin(e.target.value)} placeholder={t("profileEdit.needTypePlaceholder")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("profileEdit.householdSize")}>
              <Input type="number" inputMode="numeric" min={0} value={nbFoyer} onChange={(e) => setNbFoyer(e.target.value)} />
            </Field>
            <Field label={t("profileEdit.salaryOffered")}>
              <Input type="number" inputMode="numeric" min={0} value={salairePropose} onChange={(e) => setSalairePropose(e.target.value)} placeholder={t("profileEdit.optional")} />
            </Field>
          </div>
          <Field label={t("profileEdit.housingType")}>
            <Input value={typeLogement} onChange={(e) => setTypeLogement(e.target.value)} placeholder={t("profileEdit.housingPlaceholder")} />
          </Field>
          <Field label={t("profileEdit.usualHours")}>
            <Input value={horaires} onChange={(e) => setHoraires(e.target.value)} placeholder={t("profileEdit.hoursPlaceholder")} />
          </Field>
          <Field label={t("profileEdit.description")}>
            <Textarea value={empDesc} onChange={(e) => setEmpDesc(e.target.value)} placeholder={t("profileEdit.descriptionPlaceholder")} />
          </Field>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : t("profileEdit.save")}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
