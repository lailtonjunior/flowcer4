import { z } from "zod";

export const professionalSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Informe o nome").max(120),
  specialty: z.string().min(2, "Informe a especialidade").max(80),
  display_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato #RRGGBB"),
  room: z.string().max(40).optional().nullable(),
  default_appointment_minutes: z.coerce.number().int().min(5).max(480),
  is_active: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export type ProfessionalInput = z.infer<typeof professionalSchema>;
