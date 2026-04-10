"use client";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentDrawer } from "./appointment-drawer";
import { STATUS_LABELS } from "@/lib/constants/status";
import { formatTime, buildDaySlots, nowTimeString } from "@/lib/utils/dates";
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
  const [defaultProId, setDefaultProId] = useState<string | undefined>();
  const [defaultStart, setDefaultStart] = useState<string | undefined>();

  function openCreate(proId: string, slot: string) {
    setEditing(null);
    setDefaultProId(proId);
    setDefaultStart(slot);
    setDrawerOpen(true);
  }

  function openEdit(appt: AppointmentWithRelations) {
    setEditing(appt);
    setDrawerOpen(true);
  }

  // Mapeia agendamentos por profissional + start time
  const apptsByPro = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>();
    for (const a of appointments) {
      if (!map.has(a.professional_id)) map.set(a.professional_id, []);
      map.get(a.professional_id)!.push(a);
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
              className="sticky top-0 z-10 border-b border-l border-border bg-muted/50 px-3 py-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: p.display_color }}
                />
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.specialty}
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
                  const list = apptsByPro.get(p.id) ?? [];
                  const item = list.find((a) => a.start_time.slice(0, 5) === slot);
                  return (
                    <div
                      key={`${p.id}-${slot}`}
                      className={cn(
                        "group relative min-h-[44px] border-b border-l border-border p-1",
                        isCurrentSlot && "bg-aqua-50/40"
                      )}
                    >
                      {item ? (
                        <button
                          onClick={() => openEdit(item)}
                          className="w-full rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm transition hover:shadow-md"
                          style={{
                            borderLeftColor: p.display_color,
                            background: `${p.display_color}14`,
                          }}
                        >
                          <p className="font-semibold text-foreground">
                            {item.patient
                              ? `${item.patient.spp} — ${item.patient.name}`
                              : "Bloqueado"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTime(item.start_time)}–
                            {formatTime(item.end_time)} • {STATUS_LABELS[item.status]}
                          </p>
                        </button>
                      ) : (
                        <button
                          onClick={() => openCreate(p.id, slot)}
                          className="flex h-full w-full items-center justify-center rounded-md text-muted-foreground/30 opacity-0 transition hover:bg-muted/40 group-hover:opacity-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
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
        defaultProfessionalId={defaultProId}
        defaultStart={defaultStart}
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
