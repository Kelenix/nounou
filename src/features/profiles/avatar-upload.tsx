"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

/**
 * Sélection + upload d'une photo de profil vers le bucket `avatars`
 * (dossier `<uid>/...`, imposé par la RLS Storage). Renvoie l'URL publique.
 */
export function AvatarUpload({
  userId,
  value,
  nom,
  prenom,
  onChange,
}: {
  userId: string;
  value: string | null;
  nom?: string | null;
  prenom?: string | null;
  onChange: (url: string) => void;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Image trop lourde (max 5 Mo)", "error");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast("Échec de l'upload de la photo", "error");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setUploading(false);
    onChange(data.publicUrl);
    toast("Photo mise à jour", "success");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative"
        aria-label="Changer la photo"
      >
        <Avatar src={value} nom={nom} prenom={prenom} className="size-24" />
        <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          {uploading ? <Spinner className="size-4 text-primary-foreground" /> : <Camera className="size-4" />}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <span className="text-xs text-muted-foreground">Photo de profil (optionnelle)</span>
    </div>
  );
}
