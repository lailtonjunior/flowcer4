"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";
import {
  professionalSchema,
  type ProfessionalInput,
} from "@/lib/validators/professional";

export async function listProfessionals(opts?: { onlyActive?: boolean }) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  let query = supabase.from("professionals").select("*").order("name");
  if (opts?.onlyActive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertProfessional(input: ProfessionalInput) {
  await requireAdmin();
  const parsed = professionalSchema.parse(input);
  const supabase = await createServerSupabase();
  const payload = {
    name: parsed.name,
    specialty: parsed.specialty,
    display_color: parsed.display_color,
    room: parsed.room || null,
    default_appointment_minutes: parsed.default_appointment_minutes,
    is_active: parsed.is_active,
    notes: parsed.notes || null,
  };

  const { error } = parsed.id
    ? await supabase.from("professionals").update(payload).eq("id", parsed.id)
    : await supabase.from("professionals").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/profissionais");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/ao-vivo");
}

export async function deleteProfessional(id: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  // Soft delete: marca como inativo (preserva histórico de agendamentos)
  const { error } = await supabase
    .from("professionals")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/profissionais");
}
