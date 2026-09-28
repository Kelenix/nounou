import { Mail, MessageCircle, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("contact.metaTitle") };
}

export default async function ContactPage() {
  const t = await getTranslations();
  return (
    <div className="container max-w-2xl py-14">
      <h1 className="text-3xl font-extrabold md:text-4xl">{t("contact.title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("contact.subtitle")}</p>

      <div className="mt-8 space-y-4">
        <Row
          icon={<MessageCircle className="size-5" />}
          label={t("contact.whatsapp")}
          value="+39 350 859 1046"
          href="https://wa.me/393508591046"
        />
        <Row
          icon={<MessageCircle className="size-5" />}
          label={t("contact.whatsapp")}
          value="+225 07 05 34 97 51"
          href="https://wa.me/2250705349751"
        />
        <Row
          icon={<Mail className="size-5" />}
          label={t("contact.email")}
          value="sagesseamouret@gmail.com"
          href="mailto:sagesseamouret@gmail.com"
        />
        <Row
          icon={<Mail className="size-5" />}
          label={t("contact.email")}
          value="lionelkelenix@gmail.com"
          href="mailto:lionelkelenix@gmail.com"
        />
        <Row icon={<MapPin className="size-5" />} label={t("contact.address")} value={t("contact.addressValue")} />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">{t("contact.soon")}</p>
    </div>
  );
}

function Row({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <>
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </>
  );
  const className = "flex items-center gap-4 rounded-2xl border border-border bg-card p-4";
  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        className={`${className} transition-colors hover:border-primary/40 hover:bg-secondary`}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}
