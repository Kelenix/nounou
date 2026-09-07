import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://jaimanounou.com";
const SITE_DESCRIPTION =
  "Plateforme de mise en relation entre familles et aides à domicile en Côte d'Ivoire. Nounou, ménage, cuisine, garde d'enfants. La confiance avant tout.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "J'ai ma nounou — Trouvez la nounou idéale",
    template: "%s · J'ai ma nounou",
  },
  description: SITE_DESCRIPTION,
  applicationName: "J'ai ma nounou",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Nounou" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "J'ai ma nounou",
    title: "J'ai ma nounou — Trouvez la nounou idéale",
    description: SITE_DESCRIPTION,
    url: APP_URL,
    locale: "fr_FR",
    images: [{ url: "/logo.png", width: 420, height: 280, alt: "J'ai ma nounou" }],
  },
  twitter: {
    card: "summary",
    title: "J'ai ma nounou — Trouvez la nounou idéale",
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2E9E1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const analyticsSrc = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  const analyticsDomain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  return (
    <html lang={locale} className={poppins.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        {/* Analytics respectueux de la vie privée (Plausible / Umami) — actif si configuré. */}
        {analyticsSrc && analyticsDomain && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script defer data-domain={analyticsDomain} src={analyticsSrc} />
        )}
      </body>
    </html>
  );
}
