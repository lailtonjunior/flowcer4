import {
  CalendarCheck2,
  CalendarX2,
  Clock,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAppointmentsByDate } from "@/services/appointments/actions";
import { listProfessionals } from "@/services/professionals/actions";
import {
  STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/constants/status";
import { formatDate, formatTime, nowTimeString, toIsoDate } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const date = toIsoDate(new Date());
  const [appointments, professionals] = await Promise.all([
    listAppointmentsByDate(date),
    listProfessionals({ onlyActive: true }),
  ]);

  const counts = appointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const blocked = appointments.filter((a) => a.status === "blocked").length;
  const confirmed =
    (counts["confirmed"] ?? 0) + (counts["scheduled"] ?? 0);

  const now = nowTimeString();
  const upcoming = appointments
    .filter(
      (a) =>
        a.start_time.slice(0, 5) >= now &&
        ["scheduled", "confirmed"].includes(a.status)
    )
    .slice(0, 6);

  const byPro = professionals.map((p) => ({
    pro: p,
    count: appointments.filter((a) => a.professional_id === p.id).length,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Resumo de hoje — ${formatDate(new Date(), "EEEE, dd 'de' MMMM")}`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total de hoje"
          value={appointments.length}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          color="text-accent"
        />
        <StatCard
          title="Confirmados/Agendados"
          value={confirmed}
          icon={<Clock className="h-5 w-5" />}
          color="text-teal-600"
        />
        <StatCard
          title="Bloqueios"
          value={blocked}
          icon={<CalendarX2 className="h-5 w-5" />}
          color="text-navy-600"
        />
        <StatCard
          title="Profissionais ativos"
          value={professionals.length}
          icon={<Users className="h-5 w-5" />}
          color="text-aqua-500"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum atendimento restante hoje.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: a.professional.display_color }}
                      />
                      <div>
                        <p className="text-sm font-semibold">
                          {a.patient
                            ? `${a.patient.spp} — ${a.patient.name}`
                            : "Bloqueado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.professional.name} • {a.professional.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">
                        {formatTime(a.start_time)}
                      </p>
                      <Badge className="mt-1 border-border bg-muted text-[10px] text-muted-foreground">
                        {STATUS_LABELS[a.status]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ocupação por profissional</CardTitle>
          </CardHeader>
          <CardContent>
            {byPro.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre profissionais para começar.
              </p>
            ) : (
              <ul className="space-y-3">
                {byPro.map(({ pro, count }) => (
                  <li key={pro.id}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: pro.display_color }}
                        />
                        <span className="font-medium">{pro.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {count} atendimento{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.min(100, count * 10)}%`,
                          background: pro.display_color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 text-3xl font-semibold">{value}</p>
        </div>
        <div className={`rounded-full bg-muted p-3 ${color}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}
