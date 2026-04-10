"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AppointmentWithRelations } from "@/types/database";

export function useRealtimeAgenda(date: string, initial: AppointmentWithRelations[]) {
  const [appointments, setAppointments] = useState(initial);
  const [connected, setConnected] = useState(false);

  // Resync initial data sempre que o dia mudar
  useEffect(() => {
    setAppointments(initial);
  }, [initial, date]);

  useEffect(() => {
    const supabase = createBrowserSupabase();

    async function refetch() {
      const { data } = await supabase
        .from("appointments")
        .select(
          `*,
           professional:professionals(id,name,specialty,display_color,room),
           patient:patients(id,spp,name)`
        )
        .eq("appointment_date", date)
        .order("start_time");
      if (data) setAppointments(data as AppointmentWithRelations[]);
    }

    const channel = supabase
      .channel(`agenda-${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `appointment_date=eq.${date}`,
        },
        () => refetch()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "professional_blocks",
        },
        () => refetch()
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  return { appointments, connected };
}
