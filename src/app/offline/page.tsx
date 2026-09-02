import { WifiOff } from "lucide-react";

export const metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <WifiOff className="size-8" />
      </span>
      <h1 className="text-2xl font-extrabold">Vous êtes hors ligne</h1>
      <p className="max-w-sm text-muted-foreground">
        Vérifiez votre connexion internet puis réessayez. Certaines pages déjà consultées
        restent accessibles.
      </p>
    </div>
  );
}
