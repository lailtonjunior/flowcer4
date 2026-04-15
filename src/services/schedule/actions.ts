"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";
import { addMinutesToTime } from "@/lib/utils/dates";
import type { ScheduleTemplateSlotWithRelations } from "@/types/database";

const SELECT_TEMPLATE = `*,
  professional:professionals(
    id, name, specialty, display_color, room, default_appointment_minutes
  )`;

export async function listScheduleTemplate(): Promise<
  ScheduleTemplateSlotWithRelations[]
> {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("schedule_template_slots")
    .select(SELECT_TEMPLATE)
    .eq("is_active", true)
    .order("start_time")
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? []) as ScheduleTemplateSlotWithRelations[];
}

/** Atribui (ou desatribui — passando null) um profissional a uma linha. */
export async function assignProfessional(
  slotId: string,
  professionalId: string | null
) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("schedule_template_slots")
    .update({ professional_id: professionalId })
    .eq("id", slotId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/ao-vivo");
}

/**
 * Adiciona uma nova linha em um horário existente. Posição é calculada
 * como (max(position naquele horário) + 1).
 */
export async function addScheduleRow(args: {
  startTime: string;
  endTime?: string;
  professionalId?: string | null;
}) {
  await requireAdmin();
  const supabase = await createServerSupabase();

  const { data: existing, error: e1 } = await supabase
    .from("schedule_template_slots")
    .select("position")
    .eq("start_time", args.startTime)
    .order("position", { ascending: false })
    .limit(1);
  if (e1) throw new Error(e1.message);

  const nextPos =
    existing && existing.length > 0 ? existing[0].position + 1 : 1;
  const endTime = args.endTime ?? addMinutesToTime(args.startTime, 40);

  const { error } = await supabase.from("schedule_template_slots").insert({
    start_time: args.startTime,
    end_time: endTime,
    position: nextPos,
    professional_id: args.professionalId ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/agenda");
  return { position: nextPos };
}

/**
 * Conta quantos agendamentos existem para a (professional_id, start_time)
 * desta linha — útil para o diálogo de confirmação no client.
 */
export async function countRowAppointments(
  slotId: string
): Promise<number> {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data: slot } = await supabase
    .from("schedule_template_slots")
    .select("professional_id, start_time")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot || !slot.professional_id) return 0;
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", slot.professional_id)
    .eq("start_time", slot.start_time);
  return count ?? 0;
}

/**
 * Versão em massa: dado um conjunto de IDs de linhas, retorna o total de
 * agendamentos vinculados (soma de todas). Usado para a mensagem única
 * de confirmação antes de excluir várias linhas de uma vez.
 */
export async function countRowsAppointments(
  slotIds: string[]
): Promise<number> {
  await requireAdmin();
  if (slotIds.length === 0) return 0;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc(
    "count_schedule_rows_appointments",
    { ids: slotIds }
  );
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

/**
 * Exclusão em massa de linhas do template. Se `cascadeAppointments`,
 * apaga também todos os agendamentos dos `(profissional, horário)`
 * correspondentes, em qualquer data. Tudo em 1 round-trip HTTP e 1
 * transação no Postgres (RPC).
 */
export async function bulkDeleteScheduleRows(
  slotIds: string[],
  opts: { cascadeAppointments?: boolean } = {}
): Promise<number> {
  await requireAdmin();
  if (slotIds.length === 0) return 0;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("delete_schedule_rows", {
    ids: slotIds,
    cascade_appts: !!opts.cascadeAppointments,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/ao-vivo");
  return (data as number) ?? slotIds.length;
}

/**
 * Remove uma linha do template. Se `cascadeAppointments=true`, apaga
 * também TODOS os agendamentos que existiam naquele
 * (profissional, horário) — em qualquer data.
 */
export async function deleteScheduleRow(
  slotId: string,
  opts: { cascadeAppointments?: boolean } = {}
) {
  await requireAdmin();
  const supabase = await createServerSupabase();

  const { data: slot } = await supabase
    .from("schedule_template_slots")
    .select("id, professional_id, start_time")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) throw new Error("Linha não encontrada.");

  if (opts.cascadeAppointments && slot.professional_id) {
    const { error: dErr } = await supabase
      .from("appointments")
      .delete()
      .eq("professional_id", slot.professional_id)
      .eq("start_time", slot.start_time);
    if (dErr) throw new Error(dErr.message);
  }

  const { error } = await supabase
    .from("schedule_template_slots")
    .delete()
    .eq("id", slotId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/ao-vivo");
}
