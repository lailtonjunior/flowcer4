import { z } from "zod";

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido");

export const availabilitySchema = z
  .object({
    id: z.string().uuid().optional(),
    professional_id: z.string().uuid(),
    weekday: z.coerce.number().int().min(0).max(6),
    start_time: time,
    end_time: time,
    slot_minutes: z.coerce.number().int().min(5).max(480),
    is_active: z.boolean().default(true),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "Horário final deve ser maior que o inicial",
    path: ["end_time"],
  });

export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const blockSchema = z
  .object({
    id: z.string().uuid().optional(),
    professional_id: z.string().uuid(),
    recurring: z.boolean().default(false),
    weekday: z.coerce.number().int().min(0).max(6).optional().nullable(),
    block_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
      .optional()
      .nullable(),
    start_time: time,
    end_time: time,
    reason: z.string().max(200).optional().nullable(),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "Horário final deve ser maior que o inicial",
    path: ["end_time"],
  })
  .refine(
    (v) => (v.recurring ? v.weekday !== null && v.weekday !== undefined : !!v.block_date),
    { message: "Defina o dia da semana ou data conforme o tipo", path: ["block_date"] }
  );

export type BlockInput = z.infer<typeof blockSchema>;
