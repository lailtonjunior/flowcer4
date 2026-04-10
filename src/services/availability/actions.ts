"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";
import {
  availabilitySchema,
  blockSchema,
  type AvailabilityInput,
  type BlockInput,
} from "@/lib/validators/availability";
import type {
  ProfessionalBlock,
  ProfessionalWeeklyAvailability,
} from "@/types/database";

export async function listAvailability(professionalId: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("professional_weekly_availability")
    .select("*")
    .eq("professional_id", professionalId)
    .order("weekday")
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as ProfessionalWeeklyAvailability[];
}

export async function upsertAvailability(input: AvailabilityInput) {
  await requireAdmin();
  const parsed = availabilitySchema.parse(input);
  const supabase = await createServerSupabase();
  const payload = {
    professional_id: parsed.professional_id,
    weekday: parsed.weekday,
    start_time: parsed.start_time,
    end_time: parsed.end_time,
    slot_minutes: parsed.slot_minutes,
    is_active: parsed.is_active,
  };
  const { error } = parsed.id
    ? await supabase
        .from("professional_weekly_availability")
        .update(payload)
        .eq("id", parsed.id)
    : await supabase.from("professional_weekly_availability").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/profissionais/${parsed.professional_id}/disponibilidade`);
}

export async function deleteAvailability(id: string, professionalId: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("professional_weekly_availability")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/profissionais/${professionalId}/disponibilidade`);
}

// ---------- BLOCKS ----------

export async function listBlocks(professionalId?: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  let query = supabase
    .from("professional_blocks")
    .select("*, professional:professionals(id,name,display_color)")
    .order("recurring", { ascending: false })
    .order("block_date", { ascending: true });
  if (professionalId) query = query.eq("professional_id", professionalId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertBlock(input: BlockInput) {
  await requireAdmin();
  const parsed = blockSchema.parse(input);
  const supabase = await createServerSupabase();
  const payload = {
    professional_id: parsed.professional_id,
    recurring: parsed.recurring,
    weekday: parsed.recurring ? parsed.weekday : null,
    block_date: parsed.recurring ? null : parsed.block_date,
    start_time: parsed.start_time,
    end_time: parsed.end_time,
    reason: parsed.reason || null,
  };
  const { error } = parsed.id
    ? await supabase.from("professional_blocks").update(payload).eq("id", parsed.id)
    : await supabase.from("professional_blocks").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/profissionais/${parsed.professional_id}/disponibilidade`);
  revalidatePath("/admin/bloqueios");
  revalidatePath("/admin/agenda");
}

export async function deleteBlock(id: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("professional_blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bloqueios");
  revalidatePath("/admin/agenda");
}
