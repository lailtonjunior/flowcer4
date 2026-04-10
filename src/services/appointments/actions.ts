"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";
import {
  appointmentSchema,
  type AppointmentInput,
} from "@/lib/validators/appointment";
import { parseIsoDate } from "@/lib/utils/dates";
import type {
  AppointmentStatus,
} from "@/lib/constants/status";
import type { AppointmentWithRelations } from "@/types/database";

export async function listAppointmentsByDate(date: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `*,
       professional:professionals(id,name,specialty,display_color,room),
       patient:patients(id,spp,name)`
    )
    .eq("appointment_date", date)
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as AppointmentWithRelations[];
}

export async function listAppointmentsRange(startDate: string, endDate: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `*,
       professional:professionals(id,name,specialty,display_color,room),
       patient:patients(id,spp,name)`
    )
    .gte("appointment_date", startDate)
    .lte("appointment_date", endDate)
    .order("appointment_date")
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as AppointmentWithRelations[];
}

interface ConflictCheck {
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  excludeId?: string | null;
}

async function validateNoConflicts(input: ConflictCheck) {
  const supabase = await createServerSupabase();

  // 1. Disponibilidade semanal (weekday)
  const weekday = parseIsoDate(input.appointment_date).getDay();
  const { data: avail } = await supabase
    .from("professional_weekly_availability")
    .select("*")
    .eq("professional_id", input.professional_id)
    .eq("weekday", weekday)
    .eq("is_active", true);

  if (!avail || avail.length === 0) {
    throw new Error("Profissional não atende neste dia da semana.");
  }
  const fitsAvailability = avail.some(
    (a) => a.start_time <= input.start_time && a.end_time >= input.end_time
  );
  if (!fitsAvailability) {
    throw new Error("Horário fora da janela de atendimento do profissional.");
  }

  // 2. Bloqueios (recorrente do weekday OU pontual da data)
  const { data: blocks } = await supabase
    .from("professional_blocks")
    .select("*")
    .eq("professional_id", input.professional_id);

  const inBlock = (blocks ?? []).some((b) => {
    const matchesDay = b.recurring
      ? b.weekday === weekday
      : b.block_date === input.appointment_date;
    if (!matchesDay) return false;
    return b.start_time < input.end_time && b.end_time > input.start_time;
  });
  if (inBlock) {
    throw new Error("Horário cai sobre um bloqueio do profissional.");
  }

  // 3. Outros agendamentos ativos do profissional na mesma data
  let query = supabase
    .from("appointments")
    .select("id, start_time, end_time, status")
    .eq("professional_id", input.professional_id)
    .eq("appointment_date", input.appointment_date)
    .in("status", ["scheduled", "confirmed", "blocked"]);
  if (input.excludeId) query = query.neq("id", input.excludeId);

  const { data: existing } = await query;
  const overlap = (existing ?? []).some(
    (e) => e.start_time < input.end_time && e.end_time > input.start_time
  );
  if (overlap) {
    throw new Error("Conflito: já existe um atendimento neste horário.");
  }
}

export async function upsertAppointment(input: AppointmentInput) {
  const { admin } = await requireAdmin();
  const parsed = appointmentSchema.parse(input);
  const supabase = await createServerSupabase();

  // Validação de regras de negócio (exceto bloqueios manuais)
  if (parsed.status !== "blocked") {
    await validateNoConflicts({
      professional_id: parsed.professional_id,
      appointment_date: parsed.appointment_date,
      start_time: parsed.start_time,
      end_time: parsed.end_time,
      excludeId: parsed.id ?? null,
    });
  }

  const payload = {
    professional_id: parsed.professional_id,
    patient_id: parsed.patient_id || null,
    appointment_date: parsed.appointment_date,
    start_time: parsed.start_time,
    end_time: parsed.end_time,
    status: parsed.status,
    notes: parsed.notes || null,
    updated_by: admin.id,
  };

  if (parsed.id) {
    const { error } = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", parsed.id);
    if (error) throw mapDbError(error);
  } else {
    const { error } = await supabase
      .from("appointments")
      .insert({ ...payload, created_by: admin.id });
    if (error) throw mapDbError(error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/ao-vivo");
}

export async function changeAppointmentStatus(
  id: string,
  status: AppointmentStatus
) {
  const { admin } = await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_by: admin.id })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/ao-vivo");
}

export async function deleteAppointment(id: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/ao-vivo");
}

function mapDbError(error: { code?: string; message: string }) {
  if (error.code === "23P01") {
    return new Error("Conflito de horário detectado pelo banco.");
  }
  return new Error(error.message);
}
