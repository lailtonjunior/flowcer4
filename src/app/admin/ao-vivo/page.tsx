import { LiveGrid } from "@/components/ao-vivo/live-grid";
import { listAppointmentsByDate } from "@/services/appointments/actions";
import { listProfessionals } from "@/services/professionals/actions";
import { toIsoDate } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function AoVivoPage() {
  const date = toIsoDate(new Date());
  const [appointments, professionals] = await Promise.all([
    listAppointmentsByDate(date),
    listProfessionals({ onlyActive: true }),
  ]);

  return (
    <LiveGrid
      date={date}
      initialAppointments={appointments}
      professionals={professionals}
    />
  );
}
