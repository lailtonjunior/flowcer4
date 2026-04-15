"use client";
import React, { useMemo, useState, useTransition } from "react";
import { Plus, Sun, Sunset, X } from "lucide-react";
import {
  parseIsoDate,
  toIsoDate,
  getWeekDays,
} from "@/lib/utils/dates";
import { AppointmentDrawer } from "./appointment-drawer";
import { InlinePatientSearch } from "./inline-patient-search";
import { InlineProfessionalSearch } from "./inline-professional-search";
import { AddRowButton, DeleteRowButton } from "./row-controls";
import { BulkRowActions } from "./bulk-row-actions";
import { AddTimeSlotDialog } from "./add-time-slot-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type {
  AppointmentWithRelations,
  Patient,
  Professional,
  ScheduleTemplateSlotWithRelations,
} from "@/types/database";

export const WEEKDAYS_SHORT = [
  "2ª FEIRA",
  "3ª FEIRA",
  "4ª FEIRA",
  "5ª FEIRA",
  "6ª FEIRA",
];

interface Props {
  date: string;
  professionals: Professional[];
  patients: Patient[];
  appointments: AppointmentWithRelations[];
  template: ScheduleTemplateSlotWithRelations[];
  /** Map: professionalId → dias-da-semana (0..6) em que ele atende */
  weekdayAvailability: Record<string, number[]>;
}

export function WeeklyGrid({
  date,
  professionals,
  patients,
  appointments,
  template,
  weekdayAvailability,
}: Props) {
  const current = parseIsoDate(date);
  const weekDays = useMemo(() => getWeekDays(current).slice(0, 5), [current]);

  // Agrupa as linhas do template por horário (preserva ordem de position)
  const rowsByTime = useMemo(() => {
    const map = new Map<string, ScheduleTemplateSlotWithRelations[]>();
    for (const t of template) {
      const key = t.start_time.slice(0, 5);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [template]);

  const orderedTimes = useMemo(
    () => [...rowsByTime.keys()].sort(),
    [rowsByTime]
  );

  // Separa em Manhã (< 12:00) e Tarde (>= 12:00).
  const morningTimes = useMemo(
    () => orderedTimes.filter((t) => t < "12:00"),
    [orderedTimes]
  );
  const afternoonTimes = useMemo(
    () => orderedTimes.filter((t) => t >= "12:00"),
    [orderedTimes]
  );

  // Map: date -> "HH:mm" -> profissional_id -> Appointment[]
  const apptsMap = useMemo(() => {
    const map = new Map<
      string,
      Map<string, Map<string, AppointmentWithRelations[]>>
    >();
    for (const a of appointments) {
      if (!map.has(a.appointment_date)) map.set(a.appointment_date, new Map());
      const dateMap = map.get(a.appointment_date)!;
      const timeSlot = a.start_time.slice(0, 5);
      if (!dateMap.has(timeSlot)) dateMap.set(timeSlot, new Map());
      const slotMap = dateMap.get(timeSlot)!;
      if (!slotMap.has(a.professional_id))
        slotMap.set(a.professional_id, []);
      slotMap.get(a.professional_id)!.push(a);
    }
    return map;
  }, [appointments]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentWithRelations | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(() => new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogPeriod, setAddDialogPeriod] = useState<"morning" | "afternoon">(
    "morning"
  );

  function openAddDialog(period: "morning" | "afternoon") {
    setAddDialogPeriod(period);
    setAddDialogOpen(true);
  }

  /**
   * Profissional atende no dia da semana?
   * Se não houver nenhuma entrada de availability para o pro, assumimos
   * que atende sempre (não bloqueia). Só bloqueia quando há config
   * explícita que NÃO inclui aquele weekday.
   */
  function proAttendsOnDay(professionalId: string, weekday: number): boolean {
    const days = weekdayAvailability[professionalId];
    if (!days || days.length === 0) return true;
    return days.includes(weekday);
  }

  /**
   * Vagas disponíveis por dia (header): template rows visíveis em que o
   * pro atende no dia E não há appointment ocupando aquele (pro, slot, dia).
   */
  const availabilityByDay = useMemo(() => {
    const result = new Map<string, { free: number; total: number }>();
    for (const day of weekDays) {
      const dayStr = toIsoDate(day);
      const weekday = day.getDay();
      let total = 0;
      let free = 0;
      for (const tmpl of template) {
        if (!tmpl.professional) continue;
        if (!proAttendsOnDay(tmpl.professional.id, weekday)) continue;
        total += 1;
        const appts =
          apptsMap
            .get(dayStr)
            ?.get(tmpl.start_time.slice(0, 5))
            ?.get(tmpl.professional.id) ?? [];
        if (appts.length === 0) free += 1;
      }
      result.set(dayStr, { free, total });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, template, apptsMap, weekdayAvailability]);

  function toggleRowSelection(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectSlot(slot: string, rows: ScheduleTemplateSlotWithRelations[]) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      const allSelected = rows.every((r) => next.has(r.id));
      if (allSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  const allRowIds = useMemo(() => template.map((t) => t.id), [template]);
  const allSelected =
    allRowIds.length > 0 && allRowIds.every((id) => selectedRows.has(id));

  function toggleSelectAll() {
    setSelectedRows((prev) => {
      if (allSelected) return new Set();
      return new Set(allRowIds);
    });
  }

  function openEdit(appt: AppointmentWithRelations) {
    setEditing(appt);
    setDrawerOpen(true);
  }

  function handleQuickDelete(apptId: string) {
    startDeleteTransition(async () => {
      try {
        const { deleteAppointment } = await import(
          "@/services/appointments/actions"
        );
        await deleteAppointment(apptId);
      } catch (e) {
        console.error("Erro ao remover:", e);
      }
    });
  }

  if (orderedTimes.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            Grade vazia
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cadastre o primeiro horário de atendimento para começar a montar
            sua agenda.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant="default"
              onClick={() => openAddDialog("morning")}
            >
              <Sun className="h-4 w-4" /> Novo horário (manhã)
            </Button>
            <Button
              variant="outline"
              onClick={() => openAddDialog("afternoon")}
            >
              <Sunset className="h-4 w-4" /> Novo horário (tarde)
            </Button>
          </div>
        </div>
        <AddTimeSlotDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          professionals={professionals}
          period={addDialogPeriod}
        />
      </>
    );
  }

  /**
   * Renderiza a seção "Manhã" ou "Tarde" da tabela: um cabeçalho de período
   * (com CTA para novo horário) + as linhas daquele período.
   */
  function renderPeriodSection(
    period: "morning" | "afternoon",
    times: string[]
  ) {
    const label = period === "morning" ? "MANHÃ" : "TARDE";
    const Icon = period === "morning" ? Sun : Sunset;
    return (
      <React.Fragment key={period}>
        <tr className="bg-primary/5">
          <td
            colSpan={6}
            className="sticky left-0 z-10 border-b-2 border-primary/40 px-2 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({times.length} horário{times.length === 1 ? "" : "s"})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAddDialog(period)}
                className="h-7 text-xs text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" /> Novo horário
              </Button>
            </div>
          </td>
        </tr>

        {times.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              className="px-4 py-6 text-center text-xs text-muted-foreground"
            >
              Nenhum horário cadastrado para este período.
            </td>
          </tr>
        ) : (
          times.map((slot) => renderTimeGroup(slot))
        )}
      </React.Fragment>
    );
  }

  function renderTimeGroup(slot: string) {
    const rows = rowsByTime.get(slot) ?? [];
    return (
      <React.Fragment key={slot}>
        {/* Cabeçalho do horário */}
        <tr className="bg-muted/20 border-b border-border">
          <td
            colSpan={6}
            className="text-left px-2 py-1 bg-muted/30 border-t-2 border-t-border"
          >
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={
                  rows.length > 0 &&
                  rows.every((r) => selectedRows.has(r.id))
                }
                onChange={() => toggleSelectSlot(slot, rows)}
                title={`Selecionar todas as linhas de ${slot}`}
                className="h-3.5 w-3.5 cursor-pointer accent-accent"
              />
              <span className="font-bold text-navy text-xs tracking-wider border-b-2 border-accent pb-0.5">
                {slot}
              </span>
            </label>
          </td>
        </tr>

        {rows.map((tmpl) => {
          const pro = tmpl.professional;
          const proColor = pro?.display_color ?? "#94a3b8";
          return (
            <tr
              key={tmpl.id}
              className={cn(
                "border-b border-border/50 hover:bg-muted/10 transition-colors",
                selectedRows.has(tmpl.id) && "ring-2 ring-inset ring-accent/40"
              )}
            >
              <td
                className="sticky left-0 z-10 w-52 border-r border-border bg-surface text-left p-0"
                style={{ background: pro ? proColor : undefined }}
              >
                <div className="flex items-stretch gap-1">
                  <div className="flex items-center pl-1.5">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(tmpl.id)}
                      onChange={() => toggleRowSelection(tmpl.id)}
                      className="h-3.5 w-3.5 cursor-pointer accent-accent"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <InlineProfessionalSearch
                      slotId={tmpl.id}
                      current={pro}
                      professionals={professionals}
                    />
                  </div>
                  <div className="flex items-center pr-1.5">
                    <DeleteRowButton slotId={tmpl.id} />
                  </div>
                </div>
              </td>

              {weekDays.map((day) => {
                const dayStr = toIsoDate(day);
                const weekday = day.getDay();
                const attends = pro
                  ? proAttendsOnDay(pro.id, weekday)
                  : false;
                const cellAppts = pro
                  ? apptsMap.get(dayStr)?.get(slot)?.get(pro.id) ?? []
                  : [];
                return (
                  <td
                    key={`${tmpl.id}-${dayStr}`}
                    className={cn(
                      "border-r border-border p-0.5 align-top min-w-[140px]",
                      pro && !attends &&
                        "bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_4px,transparent_4px,transparent_8px)]"
                    )}
                    title={
                      pro && !attends
                        ? `${pro.name} não atende neste dia da semana`
                        : undefined
                    }
                  >
                    <div className="flex flex-col gap-0.5">
                      {cellAppts.map((appt) => {
                        const phone = appt.patient?.phone;
                        const tooltip = appt.patient
                          ? `${appt.patient.name}\nSPP: ${appt.patient.spp}${
                              phone ? `\n\u260E ${phone}` : ""
                            }`
                          : "BLOQUEADO";
                        return (
                          <div
                            key={appt.id}
                            onClick={() => openEdit(appt)}
                            className="group relative w-full text-left p-1 rounded bg-surface border shadow-sm transition hover:shadow cursor-pointer"
                            style={{
                              borderColor: `${proColor}40`,
                              borderLeftWidth: "3px",
                              borderLeftColor: proColor,
                            }}
                            title={tooltip}
                          >
                            <div className="flex justify-between items-start leading-tight">
                              <span className="font-bold text-[10px] text-foreground uppercase truncate flex-1">
                                {appt.patient ? appt.patient.name : "BLOQUEADO"}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickDelete(appt.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                                title="Remover"
                              >
                                <X className="h-2.5 w-2.5 text-destructive" />
                              </button>
                            </div>
                            <span className="text-[9px] text-muted-foreground">
                              SPP: {appt.patient?.spp || "—"}
                            </span>
                          </div>
                        );
                      })}

                      {!pro ? (
                        <div className="px-2 py-1 text-[10px] text-muted-foreground italic">
                          sem profissional
                        </div>
                      ) : !attends ? (
                        <div className="flex items-center justify-center px-2 py-1 text-[10px] text-muted-foreground/70 italic">
                          Não atende
                        </div>
                      ) : (
                        <InlinePatientSearch
                          professionalId={pro.id}
                          appointmentDate={dayStr}
                          slot={slot}
                        />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}

        <tr className="bg-muted/10 border-b border-border">
          <td colSpan={6} className="px-2 py-0.5">
            <AddRowButton startTime={slot} />
          </td>
        </tr>
      </React.Fragment>
    );
  }

  return (
    <>
      {selectedRows.size > 0 && (
        <div className="mb-3">
          <BulkRowActions
            selectedIds={[...selectedRows]}
            onClear={() => setSelectedRows(new Set())}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface scrollbar-thin shadow-sm">
        <table className="w-full text-sm text-center border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="sticky left-0 z-20 w-52 border-r border-border bg-muted px-2 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    title={allSelected ? "Limpar seleção" : "Selecionar todas as linhas"}
                    className="h-3.5 w-3.5 cursor-pointer accent-accent"
                  />
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Profissional / Setor
                  </span>
                </div>
              </th>
              {weekDays.map((d, index) => {
                const counts = availabilityByDay.get(toIsoDate(d));
                const free = counts?.free ?? 0;
                const total = counts?.total ?? 0;
                const full = total > 0 && free === 0;
                return (
                  <th
                    key={d.toISOString()}
                    className="w-[18%] border-r border-border px-2 py-3 bg-muted/80"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-bold text-foreground">
                        {WEEKDAYS_SHORT[index]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {toIsoDate(d).split("-").reverse().slice(0, 2).join("/")}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums",
                          full
                            ? "bg-destructive/15 text-destructive"
                            : free > 0
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        )}
                        title={`${free} de ${total} vaga(s) livre(s)`}
                      >
                        {full
                          ? "Lotado"
                          : total === 0
                          ? "—"
                          : `${free} vaga${free === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            className={deletePending ? "opacity-70 pointer-events-none" : ""}
          >
            {renderPeriodSection("morning", morningTimes)}
            {renderPeriodSection("afternoon", afternoonTimes)}
          </tbody>
        </table>
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

      <AddTimeSlotDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        professionals={professionals}
        period={addDialogPeriod}
      />
    </>
  );
}

