"use client";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DayGrid } from "@/components/agenda/day-grid";
import { formatDate, parseIsoDate, toIsoDate } from "@/lib/utils/dates";
import type {
  AppointmentWithRelations,
  Patient,
  Professional,
} from "@/types/database";

interface Props {
  date: string;
  appointments: AppointmentWithRelations[];
  professionals: Professional[];
  patients: Patient[];
}

export function AgendaClient({ date, appointments, professionals, patients }: Props) {
  const router = useRouter();
  const current = parseIsoDate(date);

  function go(delta: number) {
    const next = toIsoDate(addDays(current, delta));
    router.push(`/admin/agenda?date=${next}`);
  }

  function jumpTo(value: string) {
    if (value) router.push(`/admin/agenda?date=${value}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => go(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => jumpTo(toIsoDate(new Date()))}>
            <Calendar className="h-4 w-4" /> Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => go(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="ml-2 text-sm font-semibold text-foreground">
            {formatDate(current, "EEEE, dd 'de' MMMM 'de' yyyy")}
          </p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => jumpTo(e.target.value)}
          className="w-auto"
        />
      </div>

      <DayGrid
        date={date}
        appointments={appointments}
        professionals={professionals}
        patients={patients}
      />
    </div>
  );
}
