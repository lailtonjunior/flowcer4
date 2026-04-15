"use client";
import { useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import { AppointmentDrawer } from "./appointment-drawer";
import { InlinePatientSearch } from "./inline-patient-search";
import { STATUS_LABELS } from "@/lib/constants/status";
import { formatTime, buildDaySlots, nowTimeString } from "@/lib/utils/dates";
import { getContrastText } from "@/lib/utils/colors";
import type {
  AppointmentWithRelations,
  Patient,
  Professional,
} from "@/types/database";
import { cn } from "@/lib/utils/cn";

interface Props {
  date: string;
  professionals: Professional[];
  patients: Patient[];
  appointments: AppointmentWithRelations[];
  startHour?: string;
  endHour?: string;
  slotMinutes?: number;
}

export function DayGrid({
  date,
  professionals,
  patients,
  appointments,
  startHour = "07:00",
  endHour = "20:00",
  slotMinutes = 30,
}: Props) {
  const slots = useMemo(
    () => buildDaySlots(startHour, endHour, slotMinutes),
    [startHour, endHour, slotMinutes]
  );
  const activePros = professionals.filter((p) => p.is_active);
  const now = nowTimeString();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentWithRelations | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function openEdit(appt: AppointmentWithRelations) {
    setEditing(appt);
    setDrawerOpen(true);
  }

  function handleQuickDelete(apptId: string) {
    startDeleteTransition(async () => {
      try {
        const { deleteAppointment } = await import("@/services/appointments/actions");
        await deleteAppointment(apptId);
      } catch (e) {
        console.error("Erro ao remover:", e);
      }
    });
  }

  // Map: proId -> slot -> Appointment[]
  const apptsByPro = useMemo(() => {
    const map = new Map<string, Map<string, AppointmentWithRelations[]>>();
    for (const a of appointments) {
      if (!map.has(a.professional_id)) map.set(a.professional_id, new Map());
      const proMap = map.get(a.professional_id)!;
      const timeSlot = a.start_time.slice(0, 5);
      if (!proMap.has(timeSlot)) proMap.set(timeSlot, []);
      proMap.get(timeSlot)!.push(a);
    }
    return map;
  }, [appointments]);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface scrollbar-thin">
        <div
          className="grid min-w-fit"
          style={{
            gridTemplateColumns: `80px repeat(${activePros.length}, minmax(180px, 1fr))`,
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-border bg-muted/50 px-2 py-3 text-xs font-semibold text-muted-foreground">
            Horário
          </div>
          {activePros.map((p) => (
            <div
              key={p.id}
              className="sticky top-0 z-10 border-b border-l border-border px-3 py-3"
              style={{
                background: p.display_color,
                color: getContrastText(p.display_color),
              }}
            >
              <p className="text-sm font-semibold uppercase tracking-wide">
                {p.specialty}
              </p>
              <p className="text-xs opacity-90">
                {p.name}
                {p.room ? ` • ${p.room}` : ""}
              </p>
            </div>
          ))}

          {/* Slots */}
          {slots.map((slot) => {
            const isCurrentSlot =
              slot <= now && now < addMinutes(slot, slotMinutes);
            return (
              <div key={slot} className="contents">
                <div
                  className={cn(
                    "border-b border-border px-2 py-2 text-right text-xs font-mono",
                    isCurrentSlot
                      ? "bg-aqua-100 font-semibold text-navy-700"
                      : "text-muted-foreground"
                  )}
                >
                  {slot}
                </div>
                {activePros.map((p) => {
                  const cellAppts = apptsByPro.get(p.id)?.get(slot) ?? [];
                  return (
                    <div
                      key={`${p.id}-${slot}`}
                      className={cn(
                        "group relative min-h-[44px] border-b border-l border-border p-1",
                        isCurrentSlot && "bg-aqua-50/40",
                        deletePending && "opacity-70 pointer-events-none"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        {/* Existing appointments */}
                        {cellAppts.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => openEdit(item)}
                            className="group/card relative w-full rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm transition hover:shadow-md cursor-pointer"
                            style={{
                              borderLeftColor: p.display_color,
                              background: `${p.display_color}14`,
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-foreground truncate flex-1">
                                {item.patient
                                  ? `${item.patient.spp} — ${item.patient.name}`
                                  : "Bloqueado"}
                              </p>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuickDelete(item.id); }}
                                className="opacity-0 group-hover/card:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                                title="Remover"
                              >
                                <X className="h-2.5 w-2.5 text-destructive" />
                              </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {formatTime(item.start_time)}–
                              {formatTime(item.end_time)} • {STATUS_LABELS[item.status]}
                            </p>
                          </div>
                        ))}
                        
                        {/* Inline search for adding patients */}
                        <InlinePatientSearch
                          professionalId={p.id}
                          appointmentDate={date}
                          slot={slot}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <AppointmentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initial={editing}
        defaultDate={date}
        defaultProfessionalId={undefined}
        defaultStart={undefined}
        professionals={professionals}
        patients={patients}
      />
    </>
  );
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
