import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { listAppointmentsByDate } from "@/services/appointments/actions";
import { listProfessionals } from "@/services/professionals/actions";
import { listPatients } from "@/services/patients/actions";
import { toIsoDate } from "@/lib/utils/dates";
import { AgendaClient } from "./agenda-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const date = sp.date ?? toIsoDate(new Date());

  const [appointments, professionals, patients] = await Promise.all([
    listAppointmentsByDate(date),
    listProfessionals(),
    listPatients(),
  ]);

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Visão da agenda diária por profissional. Clique em um slot para criar."
      />
      <Card className="p-4">
        <AgendaClient
          date={date}
          appointments={appointments}
          professionals={professionals}
          patients={patients}
        />
      </Card>
    </>
  );
}
