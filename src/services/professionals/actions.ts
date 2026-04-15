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
  // Ordena pela posição manual (display_order), com fallback alfabético.
  // nullsFirst:false garante que profissionais sem ordem definida vão pro fim.
  let query = supabase
    .from("professionals")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  if (opts?.onlyActive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Recebe a lista de IDs na ordem desejada e chama a RPC `reorder_professionals`
 * que faz UM UPDATE em massa (via unnest WITH ORDINALITY).
 *
 * Round-trips HTTP: 1 (vs N anteriormente).
 * A RPC é SECURITY DEFINER e re-valida o admin no servidor.
 */
export async function reorderProfessionals(orderedIds: string[]) {
  await requireAdmin();
  if (orderedIds.length === 0) return { count: 0 };
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("reorder_professionals", {
    ids: orderedIds,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/profissionais");
  revalidatePath("/admin/ao-vivo");
  return { count: (data as number) ?? orderedIds.length };
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

export async function bulkDeactivateProfessionals(ids: string[]) {
  await requireAdmin();
  if (ids.length === 0) return { count: 0 };
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("professionals")
    .update({ is_active: false })
    .in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/profissionais");
  revalidatePath("/admin/agenda");
  return { count: ids.length };
}

export async function syncProfessionalsFromSigh() {
  await requireAdmin();
  const { querySigh } = await import("@/lib/db/sigh");
  const supabase = await createServerSupabase();

  // Query all prestadores with their CBO codes
  const query = `
    SELECT DISTINCT p.id_prestador, p.nome_reduzido, v.codigo_cbo
    FROM sigh.prestadores p
    LEFT JOIN sigh.v_cons_prestadores_cbos_hlis v ON v.id_prestador = p.id_prestador
    WHERE p.nome_reduzido IS NOT NULL AND p.nome_reduzido <> ''
    ORDER BY p.nome_reduzido
  `;

  const records = await querySigh<{
    id_prestador: number;
    nome_reduzido: string;
    codigo_cbo: string | null;
  }>(query);

  if (!records || records.length === 0) return { count: 0, specialties: [] };

  // Mapa expandido de CBOs para nomes de especialidades
  const cboMap: Record<string, string> = {
    // Fisioterapia
    "226140": "Fisioterapia",
    "226105": "Fisioterapia",
    "226110": "Fisioterapia",
    "226115": "Fisioterapia",
    "226120": "Fisioterapia",
    "226125": "Fisioterapia",
    "226130": "Fisioterapia",
    "226135": "Fisioterapia",
    "226145": "Fisioterapia",
    "226150": "Fisioterapia",
    "226155": "Fisioterapia",
    "226160": "Fisioterapia",
    "226165": "Fisioterapia",
    // Fonoaudiologia
    "223810": "Fonoaudiologia",
    "223805": "Fonoaudiologia",
    "223815": "Fonoaudiologia",
    "223820": "Fonoaudiologia",
    // Terapia Ocupacional
    "223905": "Terapia Ocupacional",
    "223910": "Terapia Ocupacional",
    "223915": "Terapia Ocupacional",
    // Psicologia
    "251510": "Psicologia",
    "251505": "Psicologia",
    "251515": "Psicologia",
    "251520": "Psicologia",
    "251525": "Psicologia",
    "251530": "Psicologia",
    "251535": "Psicologia",
    "251540": "Psicologia",
    "251545": "Psicologia",
    "251550": "Psicologia",
    // Serviço Social
    "251605": "Serviço Social",
    "251610": "Serviço Social",
    "251615": "Serviço Social",
    // Medicina
    "225125": "Clínico Geral",
    "225320": "Generalista",
    "225130": "Fisiatra",
    "225170": "Neurologista",
    "225155": "Ortopedista",
    "225145": "Neuropediatra",
    "225285": "Psiquiatra",
    "225250": "Pediatra",
    // Enfermagem
    "223505": "Enfermagem",
    "223510": "Enfermagem",
    "223515": "Enfermagem",
    // Nutrição
    "223710": "Nutrição",
    "223705": "Nutrição",
    // Educação Física
    "224105": "Educação Física",
    "224110": "Educação Física",
    // Musicoterapia
    "226265": "Musicoterapia",
  };

  const { getSpecialtyColor } = await import("@/lib/constants/specialty-colors");

  const upsertPayload = records.map((r) => {
    let spec = "Geral";
    if (r.codigo_cbo && cboMap[r.codigo_cbo]) {
      spec = cboMap[r.codigo_cbo];
    }
    
    const id = `00000000-0000-0000-0000-${String(r.id_prestador).padStart(12, '0')}`;
    
    // Cor determinada pela especialidade, não pelo profissional individual
    const color = getSpecialtyColor(spec);

    return {
      id,
      name: r.nome_reduzido || "Desconhecido",
      specialty: spec,
      display_color: color, 
      default_appointment_minutes: 40,
      is_active: true,
    };
  });

  const { error } = await supabase
    .from("professionals")
    .upsert(upsertPayload, { onConflict: "id" });

  if (error) {
    console.error("[services/professional] Erro no Upsert:", error);
    throw new Error(error.message);
  }

  // Collect all distinct specialties found
  const specialties = [...new Set(upsertPayload.map(p => p.specialty))].sort();

  revalidatePath("/admin/profissionais");
  revalidatePath("/admin/agenda");
  return { count: records.length, specialties };
}

