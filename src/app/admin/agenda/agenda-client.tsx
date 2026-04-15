"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  LayoutGrid,
  List,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DayGrid } from "@/components/agenda/day-grid";
import { WeeklyGrid } from "@/components/agenda/weekly-grid";
import { AgendaLegend } from "@/components/agenda/agenda-legend";
import { ProfessionalOrderDialog } from "@/components/agenda/professional-order-dialog";
import {
  formatDate,
  parseIsoDate,
  toIsoDate,
  getWeekDays,
} from "@/lib/utils/dates";
import type {
  AppointmentWithRelations,
  Patient,
  Professional,
  ScheduleTemplateSlotWithRelations,
} from "@/types/database";

interface Props {
  date: string;
  viewMode: "day" | "week";
  appointments: AppointmentWithRelations[];
  professionals: Professional[];
  patients: Patient[];
  template: ScheduleTemplateSlotWithRelations[];
  weekdayAvailability: Record<string, number[]>;
}

export function AgendaClient({
  date,
  viewMode,
  appointments,
  professionals,
  patients,
  template,
  weekdayAvailability,
}: Props) {
  const router = useRouter();
  const current = parseIsoDate(date);

  // Filtro de especialidades (client-side).
  // Persiste enquanto a página fica aberta; reseta em navegação completa.
  const [hiddenSpecialties, setHiddenSpecialties] = useState<Set<string>>(
    () => new Set()
  );
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const visibleProfessionals = useMemo(
    () =>
      professionals.filter(
        (p) => !hiddenSpecialties.has(p.specialty)
      ),
    [professionals, hiddenSpecialties]
  );

  function toggleSpecialty(name: string) {
    setHiddenSpecialties((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function soloSpecialty(name: string) {
    // "Ver apenas esta especialidade": oculta todas menos a clicada.
    const allOther = new Set(
      professionals
        .map((p) => p.specialty)
        .filter((s) => s !== name)
    );
    setHiddenSpecialties(allOther);
  }

  function resetSpecialties() {
    setHiddenSpecialties(new Set());
  }

  const displayLabel =
    viewMode === "week"
      ? `${formatDate(getWeekDays(current)[0], "dd/MM")} a ${formatDate(
          getWeekDays(current)[4],
          "dd/MM 'de' yyyy"
        )}`
      : formatDate(current, "EEEE, dd 'de' MMMM 'de' yyyy");

  function go(deltaDays: number) {
    const next = toIsoDate(addDays(current, deltaDays));
    router.push(`/admin/agenda?date=${next}&view=${viewMode}`);
  }

  function jumpTo(value: string) {
    if (value) router.push(`/admin/agenda?date=${value}&view=${viewMode}`);
  }

  function setView(view: "day" | "week") {
    router.push(`/admin/agenda?date=${date}&view=${view}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => go(viewMode === "week" ? -7 : -1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => jumpTo(toIsoDate(new Date()))}>
            <Calendar className="h-4 w-4 mr-2" /> Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => go(viewMode === "week" ? 7 : 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="ml-2 text-sm font-semibold text-foreground capitalize hidden sm:block">
            {displayLabel}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Input
            type="date"
            value={date}
            onChange={(e) => jumpTo(e.target.value)}
            className="w-auto"
          />
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
            >
              <List className="h-4 w-4 mr-2" /> Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Semana
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOrderDialogOpen(true)}
            title="Reordenar profissionais na grade"
          >
            <ListOrdered className="h-4 w-4 mr-2" /> Ordem da grade
          </Button>
        </div>
      </div>

      <p className="sm:hidden text-sm font-semibold text-foreground capitalize text-center">
        {displayLabel}
      </p>

      <AgendaLegend
        professionals={professionals}
        hiddenSpecialties={hiddenSpecialties}
        onToggleSpecialty={toggleSpecialty}
        onSoloSpecialty={soloSpecialty}
        onReset={resetSpecialties}
      />

      <ProfessionalOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        professionals={professionals}
      />

      {visibleProfessionals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhuma especialidade visível. Clique em uma etiqueta na legenda para
          reexibir os profissionais.
        </div>
      ) : viewMode === "week" ? (
        <WeeklyGrid
          date={date}
          appointments={appointments}
          professionals={visibleProfessionals}
          patients={patients}
          template={template.filter(
            (t) =>
              !t.professional ||
              !hiddenSpecialties.has(t.professional.specialty)
          )}
          weekdayAvailability={weekdayAvailability}
        />
      ) : (
        <DayGrid
          date={date}
          appointments={appointments}
          professionals={visibleProfessionals}
          patients={patients}
        />
      )}
    </div>
  );
}
