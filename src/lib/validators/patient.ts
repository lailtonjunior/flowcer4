import { z } from "zod";

export const patientSchema = z.object({
  id: z.string().uuid().optional(),
  spp: z
    .string()
    .min(2, "Informe o SPP")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "SPP só pode conter letras, números e -._"),
  name: z.string().min(2, "Informe o nome completo").max(160),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  guardian_name: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type PatientInput = z.infer<typeof patientSchema>;
