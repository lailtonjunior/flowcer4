import type { AppointmentStatus } from "@/lib/constants/status";

export type UUID = string;

export interface AdminUser {
  id: UUID;
  auth_user_id: UUID;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  id: UUID;
  name: string;
  specialty: string;
  display_color: string;
  room: string | null;
  default_appointment_minutes: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: UUID;
  spp: string;
  name: string;
  birth_date: string | null;
  guardian_name: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalWeeklyAvailability {
  id: UUID;
  professional_id: UUID;
  weekday: number; // 0..6 (domingo..sábado)
  start_time: string;
  end_time: string;
  slot_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalBlock {
  id: UUID;
  professional_id: UUID;
  block_date: string | null;
  weekday: number | null;
  start_time: string;
  end_time: string;
  reason: string | null;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: UUID;
  professional_id: UUID;
  patient_id: UUID | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: string | null;
  notes: string | null;
  created_by: UUID | null;
  updated_by: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithRelations extends Appointment {
  professional: Pick<
    Professional,
    "id" | "name" | "specialty" | "display_color" | "room"
  >;
  patient: Pick<Patient, "id" | "spp" | "name"> | null;
}

export interface AppointmentAuditLog {
  id: UUID;
  appointment_id: UUID;
  action_type: "insert" | "update" | "delete";
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: UUID | null;
  performed_at: string;
}
