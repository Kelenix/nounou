import { Mail, Phone, MapPin } from "lucide-react";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-14">
      <h1 className="text-3xl font-extrabold md:text-4xl">Nous contacter</h1>
      <p className="mt-3 text-muted-foreground">
        Une question, une suggestion, un souci ? Écrivez-nous, nous répondons vite.
      </p>

      <div className="mt-8 space-y-4">
        <Row icon={<Phone className="size-5" />} label="Téléphone" value="+225 07 00 00 00 00" />
        <Row icon={<Mail className="size-5" />} label="E-mail" value="contact@jaimanounou.ci" />
        <Row icon={<MapPin className="size-5" />} label="Adresse" value="Abidjan, Côte d'Ivoire" />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Un formulaire de contact en ligne sera bientôt disponible.
      </p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
