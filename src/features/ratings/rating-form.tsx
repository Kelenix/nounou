"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StarInput } from "@/components/ui/star-input";
import { useToast } from "@/components/ui/toast";
import type { RatingContext } from "@/lib/supabase/database.types";

const CRITERIA = ["ponctualite", "serieux", "qualite", "respect", "communication"] as const;

type Scores = Record<(typeof CRITERIA)[number], number>;

export function RatingForm({
  fromUser,
  toUser,
  roleContext,
  targetName,
  alreadyRated,
}: {
  fromUser: string;
  toUser: string;
  roleContext: RatingContext;
  targetName: string;
  alreadyRated: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [scores, setScores] = React.useState<Scores>({ ponctualite: 0, serieux: 0, qualite: 0, respect: 0, communication: 0 });
  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  if (alreadyRated) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
        <Star className="size-4 fill-amber-400 text-amber-400" /> {t("rating.alreadyRated", { name: targetName })}
      </div>
    );
  }

  async function submit() {
    if (Object.values(scores).some((s) => s < 1)) {
      toast(t("rating.rateEach"), "error");
      return;
    }
    setLoading(true);
    const { error } = await createClient().from("ratings").insert({
      from_user: fromUser,
      to_user: toUser,
      role_context: roleContext,
      ...scores,
      commentaire: comment.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast(t("rating.failed"), "error");
      return;
    }
    toast(t("rating.thanks"), "success");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !loading && setOpen(o)}>
      <Dialog.Trigger asChild>
        <Button variant="secondary" className="w-full">
          <Star className="size-4" /> {t("rating.rate", { name: targetName })}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-2xl data-[state=open]:animate-scale-in">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-bold">{t("rating.rate", { name: targetName })}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {t("rating.dialogDesc")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-1 text-muted-foreground hover:bg-accent"><X className="size-4" /></Dialog.Close>
          </div>

          <div className="space-y-3">
            {CRITERIA.map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium">{t(`rating.${key}`)}</span>
                <StarInput value={scores[key]} onChange={(v) => setScores((s) => ({ ...s, [key]: v }))} />
              </div>
            ))}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="comment">{t("rating.comment")}</Label>
              <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("rating.commentPlaceholder")} />
            </div>
          </div>

          <Button className="mt-5 w-full" onClick={submit} disabled={loading}>
            {loading ? <Spinner className="text-primary-foreground" /> : t("rating.submit")}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
