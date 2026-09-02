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

export const otpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/u, "Le code contient 6 chiffres"),
});

export type PhoneInput = z.infer<typeof phoneSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
