import "server-only";

import os from "node:os";
import { statfs } from "node:fs/promises";
import tls from "node:tls";

const PROBE_TIMEOUT_MS = 4000;

/** CPU réel (%) : échantillonne les compteurs des cœurs sur un court intervalle. */
async function cpuPercent(sampleMs = 250): Promise<number> {
  const snap = () => os.cpus().reduce(
    (acc, c) => {
      const total = Object.values(c.times).reduce((s, v) => s + v, 0);
      return { idle: acc.idle + c.times.idle, total: acc.total + total };
    },
    { idle: 0, total: 0 },
  );
  const a = snap();
  await new Promise((r) => setTimeout(r, sampleMs));
  const b = snap();
  const total = b.total - a.total;
  return total > 0 ? Math.round((1 - (b.idle - a.idle) / total) * 100) : 0;
}

async function diskPercent(): Promise<number | null> {
  try {
    const s = await statfs("/");
    return Math.round(((s.blocks - s.bavail) / s.blocks) * 100);
  } catch {
    return null;
  }
}

/** Ressources de la machine qui exécute l'app (le VPS, vu depuis le conteneur). */
export async function serverStats() {
  const [cpu, disk] = await Promise.all([cpuPercent(), diskPercent()]);
  return {
    cpu,
    ram: Math.round((1 - os.freemem() / os.totalmem()) * 100),
    ramTotalGb: os.totalmem() / 1024 ** 3,
    disk,
    uptimeSec: os.uptime(),
    cores: os.cpus().length,
    /** Démarrage du processus Node = dernier déploiement/redémarrage du conteneur. */
    startedAt: new Date(Date.now() - process.uptime() * 1000),
    processRssMb: Math.round(process.memoryUsage().rss / 1024 ** 2),
    nodeVersion: process.version,
  };
}

/** Date d'expiration du certificat HTTPS du domaine public (null si HTTP/injoignable). */
export function sslExpiry(appUrl: string | undefined): Promise<Date | null> {
  let host: string;
  try {
    const u = new URL(appUrl ?? "");
    if (u.protocol !== "https:") return Promise.resolve(null);
    host = u.hostname;
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, timeout: PROBE_TIMEOUT_MS }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve(cert?.valid_to ? new Date(cert.valid_to) : null);
    });
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

const PAYMENT_HOSTS: Record<string, { name: string; url: string }> = {
  cartflox: { name: "Cartflox", url: "https://cartflox.com" },
  cinetpay: { name: "CinetPay", url: "https://api-checkout.cinetpay.com" },
  paydunya: { name: "PayDunya", url: "https://app.paydunya.com" },
  stripe: { name: "Stripe", url: "https://api.stripe.com" },
};

export type ExternalService = { name: string; ok: boolean; ms: number | null };

/** Services externes CONFIGURÉS dans l'environnement, testés en joignabilité (réponse HTTP reçue). */
export async function externalServices(): Promise<ExternalService[]> {
  const env = process.env;
  const targets: { name: string; url: string }[] = [];
  if (env.RESEND_API_KEY) targets.push({ name: "Resend", url: "https://api.resend.com" });
  if (env.SMSPRO_API_TOKEN) targets.push({ name: "SMS Pro Africa", url: "https://app.smspro.africa" });
  for (const p of new Set([env.PAYMENT_MOBILE_PROVIDER, env.PAYMENT_CARD_PROVIDER])) {
    if (p && PAYMENT_HOSTS[p]) targets.push(PAYMENT_HOSTS[p]);
  }

  return Promise.all(
    targets.map(async ({ name, url }) => {
      const t0 = Date.now();
      try {
        await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(PROBE_TIMEOUT_MS), cache: "no-store" });
        return { name, ok: true, ms: Date.now() - t0 };
      } catch {
        return { name, ok: false, ms: null };
      }
    }),
  );
}
