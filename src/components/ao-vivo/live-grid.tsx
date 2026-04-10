"use client";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Maximize2,
  Minimize2,
  Moon,
  Radio,
  Sun,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeAgenda } from "./use-realtime-agenda";
import { STATUS_LABELS, STATUS_DOT } from "@/lib/constants/status";
import { formatDate, formatTime, nowTimeString } from "@/lib/utils/dates";
import type {
  AppointmentWithRelations,
  Professional,
} from "@/types/database";
import { cn } from "@/lib/utils/cn";

interface Props {
  date: string;
  initialAppointments: AppointmentWithRelations[];
  professionals: Professional[];
}

export function LiveGrid({ date, initialAppointments, professionals }: Props) {
  const { appointments, connected } = useRealtimeAgenda(date, initialAppointments);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [filter, setFilter] = useState<"all" | "morning" | "afternoon">("all");
  const [now, setNow] = useState(nowTimeString());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(nowTimeString()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => document.documentElement.classList.remove("dark");
  }, [theme]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  const activePros = professionals.filter((p) => p.is_active);

  // Agrupa por profissional
  const byPro = new Map<string, AppointmentWithRelations[]>();
  for (const a of appointments) {
    if (filter === "morning" && a.start_time >= "12:00") continue;
    if (filter === "afternoon" && a.start_time < "12:00") continue;
    if (!byPro.has(a.professional_id)) byPro.set(a.professional_id, []);
    byPro.get(a.professional_id)!.push(a);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Agenda Ao Vivo</h1>
              <p className="text-xs text-muted-foreground">
                {formatDate(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-base font-semibold tabular-nums">
              {now}
            </span>
            <span
              className={cn(
                "ml-3 flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                connected
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              )}
            >
              {connected ? (
                <>
                  <Radio className="h-3 w-3 animate-pulse-soft" /> Ao vivo
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" /> Reconectando
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-border">
              {(["all", "morning", "afternoon"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-xs transition",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {f === "all" ? "Dia" : f === "morning" ? "Manhã" : "Tarde"}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Alternar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              title="Tela cheia"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] p-6">
        {activePros.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            Nenhum profissional ativo.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activePros.map((p) => {
              const list = (byPro.get(p.id) ?? []).sort((a, b) =>
                a.start_time.localeCompare(b.start_time)
              );
              return (
                <section
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white"
                    style={{ background: p.display_color }}
                  >
                    <div className="flex-1">
                      <p className="text-base">{p.name}</p>
                      <p className="text-[11px] opacity-90">
                        {p.specialty}
                        {p.room ? ` • ${p.room}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                      {list.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {list.length === 0 ? (
                      <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                        Sem atendimentos
                      </li>
                    ) : (
                      list.map((a) => {
                        const isNow =
                          a.start_time.slice(0, 5) <= now &&
                          now < a.end_time.slice(0, 5);
                        return (
                          <li
                            key={a.id}
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 text-sm transition",
                              isNow && "bg-aqua-100/40 dark:bg-aqua-900/20",
                              a.status === "cancelled" &&
                                "opacity-50 line-through"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-1 h-2.5 w-2.5 rounded-full",
                                STATUS_DOT[a.status]
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-mono text-xs font-semibold tabular-nums">
                                  {formatTime(a.start_time)}–
                                  {formatTime(a.end_time)}
                                </span>
                                <Badge className="border-border bg-muted text-[10px] text-muted-foreground">
                                  {STATUS_LABELS[a.status]}
                                </Badge>
                              </div>
                              <p className="mt-0.5 truncate font-medium">
                                {a.patient ? (
                                  <>
                                    <span className="font-mono text-xs text-accent">
                                      {a.patient.spp}
                                    </span>
                                    {" — "}
                                    {a.patient.name}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Bloqueado
                                  </span>
                                )}
                              </p>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {/* Legenda */}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <span key={k} className="flex items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[k as never])}
              />
              {label}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
