"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";
import { patientSchema, type PatientInput } from "@/lib/validators/patient";

export async function listPatients(search?: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  let query = supabase.from("patients").select("*").order("name");
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},spp.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertPatient(input: PatientInput) {
  await requireAdmin();
  const parsed = patientSchema.parse(input);
  const supabase = await createServerSupabase();
  const payload = {
    spp: parsed.spp,
    name: parsed.name,
    birth_date: parsed.birth_date || null,
    guardian_name: parsed.guardian_name || null,
    phone: parsed.phone || null,
    notes: parsed.notes || null,
  };

  const { error } = parsed.id
    ? await supabase.from("patients").update(payload).eq("id", parsed.id)
    : await supabase.from("patients").insert(payload);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe um paciente com este SPP.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/pacientes");
  revalidatePath("/admin/agenda");
}

export async function deletePatient(id: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "Paciente possui agendamentos vinculados. Cancele-os antes de excluir."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/pacientes");
}
