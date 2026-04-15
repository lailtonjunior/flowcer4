"use client";
import { useEffect, useRef, useState } from "react";
import type {
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AppointmentWithRelations } from "@/types/database";

interface AppointmentRow {
  id: string;
  appointment_date: string;
}

const SELECT_WITH_RELATIONS = `*,
       professional:professionals(id,name,specialty,display_color,room),
       patient:patients(id,spp,name,phone)`;

/**
 * Realtime patch incremental:
 *   INSERT  → busca apenas a linha nova (com relações) e adiciona ao estado
 *   UPDATE  → busca apenas a linha atualizada e substitui no estado
 *   DELETE  → remove pelo id, sem ida ao banco
 *
 * Resultado: cada evento dispara no máximo 1 query single-row (~30ms) em vez
 * de um SELECT completo da agenda do dia. Em altíssima frequência de
 * mudanças (ex.: 5 admins editando), evita travar a TV com refetches em
 * cascata.
 */
export function useRealtimeAgenda(
  date: string,
  initial: AppointmentWithRelations[]
) {
  const [appointments, setAppointments] = useState(initial);
  const [connected, setConnected] = useState(false);
  // Guarda a data corrente sem reinscrever no canal a cada render
  const dateRef = useRef(date);

  // Resync sempre que o dia mudar (navegação entre datas no admin)
  useEffect(() => {
    setAppointments(initial);
    dateRef.current = date;
  }, [initial, date]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let cancelled = false;

    async function fetchOne(id: string): Promise<AppointmentWithRelations | null> {
      const { data, error } = await supabase
        .from("appointments")
        .select(SELECT_WITH_RELATIONS)
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return data as AppointmentWithRelations;
    }

    function applyInsertOrUpdate(row: AppointmentWithRelations) {
      // Se a edição moveu o agendamento para outro dia, removemos do estado.
      if (row.appointment_date !== dateRef.current) {
        setAppointments((prev) => prev.filter((a) => a.id !== row.id));
        return;
      }
      setAppointments((prev) => {
        const idx = prev.findIndex((a) => a.id === row.id);
        if (idx === -1) return [...prev, row];
        const next = [...prev];
        next[idx] = row;
        return next;
      });
    }

    function applyDelete(id: string) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }

    async function handleChange(
      payload: RealtimePostgresChangesPayload<AppointmentRow>
    ) {
      const newRow = payload.new as AppointmentRow | null;
      const oldRow = payload.old as AppointmentRow | null;

      if (payload.eventType === "DELETE") {
        if (oldRow?.id) applyDelete(oldRow.id);
        return;
      }

      const id = newRow?.id;
      if (!id) return;

      // Otimização: se já sabemos pelo payload que o registro NÃO pertence
      // ao dia exibido (e também não pertencia antes), nem precisamos buscar.
      const wasInThisDay = oldRow?.appointment_date === dateRef.current;
      const isInThisDay = newRow?.appointment_date === dateRef.current;
      if (!wasInThisDay && !isInThisDay) return;

      // Se SAIU do dia atual mas estava aqui, basta remover localmente.
      if (wasInThisDay && !isInThisDay) {
        applyDelete(id);
        return;
      }

      // Single-row fetch traz somente o registro alterado + relações
      const full = await fetchOne(id);
      if (cancelled || !full) return;
      applyInsertOrUpdate(full);
    }

    const channel = supabase
      .channel(`agenda-${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          // Sem filtro por data: UPDATE que MOVE o appointment para outro dia
          // não viria se filtrássemos por appointment_date=eq.X.
        },
        handleChange
      )
      .subscribe((status) => {
        if (!cancelled) setConnected(status === "SUBSCRIBED");
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [date]);

  return { appointments, connected };
}
