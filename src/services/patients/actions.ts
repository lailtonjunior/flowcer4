"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";
import { patientSchema, type PatientInput } from "@/lib/validators/patient";
import {
  PATIENTS_INDEX,
  meiliClient,
} from "@/services/meilisearch/client";

interface MeiliPatientHit {
  spp: string;
  name: string;
  birth_date: string | null;
}

/**
 * Busca pacientes. Com termo (≥3 chars) consulta o **Meilisearch** local
 * — milissegundos, tolerante a typos. Sem termo, devolve os 50 pacientes
 * mais recentes do Supabase (preview da aba).
 *
 * Após achar no Meili, faz `upsert` no Supabase pra garantir a referência
 * local (FK em `appointments.patient_id`).
 *
 * Fallback (se o Meili estiver down): busca direto no Supabase local.
 */
export async function listPatients(search?: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();

  if (!search || search.trim().length < 3) {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("name")
      .limit(50);
    return data ?? [];
  }

  const term = search.trim();

  // ----- 1. Busca no Meilisearch -----
  let hits: MeiliPatientHit[] = [];
  try {
    const result = await meiliClient.index(PATIENTS_INDEX).search(term, {
      limit: 30,
      attributesToRetrieve: ["spp", "name", "birth_date"],
    });
    hits = result.hits as MeiliPatientHit[];
  } catch (e) {
    console.error("[meili] busca falhou, caindo no fallback local:", e);
    return localFallback(supabase, term);
  }

  if (hits.length === 0) {
    // Mesmo sem hit no Meili, ainda tenta o local — pode ser paciente
    // criado direto no app (sem ter passado pelo SIGH).
    return localFallback(supabase, term);
  }

  // ----- 2. Garante "espelho" local (FK em appointments) -----
  const upsertPayload = hits.map((h) => ({
    spp: h.spp,
    name: h.name,
    birth_date: h.birth_date,
  }));

  const { data: synchronized, error } = await supabase
    .from("patients")
    .upsert(upsertPayload, { onConflict: "spp", ignoreDuplicates: false })
    .select("*");

  if (error) {
    console.error("[supabase] upsert pacientes falhou:", error);
    // Mesmo sem upsert, devolvemos os hits do Meili — UI funcionaria parcialmente
    return hits.map((h) => ({
      id: h.spp, // temporário; AppointmentDrawer usa `patient_id` que vem do upsert
      spp: h.spp,
      name: h.name,
      birth_date: h.birth_date,
      guardian_name: null,
      phone: null,
      notes: null,
      created_at: "",
      updated_at: "",
    }));
  }

  return (synchronized ?? []).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );
}

async function localFallback(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  term: string
) {
  const ilike = `%${term}%`;
  const { data } = await supabase
    .from("patients")
    .select("*")
    .or(`name.ilike.${ilike},spp.ilike.${ilike}`)
    .order("name")
    .limit(30);
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
