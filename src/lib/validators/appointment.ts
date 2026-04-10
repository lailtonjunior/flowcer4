import { z } from "zod";
import { APPOINTMENT_STATUS } from "@/lib/constants/status";

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido");

export const appointmentSchema = z
  .object({
    id: z.string().uuid().optional(),
    professional_id: z.string().uuid("Selecione um profissional"),
    patient_id: z.string().uuid().optional().nullable(),
    appointment_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    start_time: time,
    end_time: time,
    status: z.enum(APPOINTMENT_STATUS).default("scheduled"),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "Horário final deve ser maior que o inicial",
    path: ["end_time"],
  })
  .refine((v) => v.status === "blocked" || !!v.patient_id, {
    message: "Selecione um paciente",
    path: ["patient_id"],
  });

export type AppointmentInput = z.infer<typeof appointmentSchema>;
