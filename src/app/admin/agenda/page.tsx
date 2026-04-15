import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import {
  listAppointmentsByDate,
  listAppointmentsRange,
} from "@/services/appointments/actions";
import { listProfessionals } from "@/services/professionals/actions";
import { listScheduleTemplate } from "@/services/schedule/actions";
import { listAllWeekdayAvailability } from "@/services/availability/actions";
import { toIsoDate, getWeekDays, parseIsoDate } from "@/lib/utils/dates";
import { AgendaClient } from "./agenda-client";
import type { AppointmentWithRelations } from "@/types/database";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string; view?: string }>;
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const date = sp.date ?? toIsoDate(new Date());
  const viewMode = (sp.view as "day" | "week") ?? "week";

  // Pacientes NÃO são pré-carregados aqui:
  // - InlinePatientSearch e AppointmentDrawer já fazem busca dinâmica
  //   contra o SIGH conforme o usuário digita.
  // Isso elimina ~50ms (round-trip Supabase) + JSON serialization de cada
  // navegação entre dias/semanas, que acontece o tempo todo na rotina.
  let appointments: AppointmentWithRelations[] = [];
  if (viewMode === "week") {
    const weekDays = getWeekDays(parseIsoDate(date));
    const start = toIsoDate(weekDays[0]);
    const end = toIsoDate(weekDays[4]);
    appointments = await listAppointmentsRange(start, end);
  } else {
    appointments = await listAppointmentsByDate(date);
  }

  const [professionals, template, weekdayAvailability] = await Promise.all([
    listProfessionals(),
    listScheduleTemplate(),
    listAllWeekdayAvailability(),
  ]);

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Gestão de horários. Alterna entre a visão diária e a matriz semanal da equipe."
      />
      <Card className="p-4">
        <AgendaClient
          date={date}
          viewMode={viewMode}
          appointments={appointments}
          professionals={professionals}
          patients={[]}
          template={template}
          weekdayAvailability={weekdayAvailability}
        />
      </Card>
    </>
  );
}
