import { z } from "zod";

/** Numéro local ivoirien : 10 chiffres (0 initial inclus, ex. 0700000001). */
export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^\d{10}$/u.test(v), {
      message: "Entrez un numéro à 10 chiffres, ex. 07 00 00 00 00",
    }),
});

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
});

export const passwordSchema = z.object({
  password: z.string().min(8, "8 caractères minimum"),
});

export type PhoneInput = z.infer<typeof phoneSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
