import {
  addDays,
  addMinutes,
  format,
  isSameDay,
  parse,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

export function formatTime(time: string): string {
  // time vem como "HH:mm:ss" ou "HH:mm"
  return time.slice(0, 5);
}

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseIsoDate(value: string): Date {
  return parse(value, "yyyy-MM-dd", new Date());
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const base = new Date();
  base.setHours(h, m, 0, 0);
  const result = addMinutes(base, minutes);
  return format(result, "HH:mm");
}

export function buildDaySlots(
  start: string,
  end: string,
  slotMinutes: number
): string[] {
  const slots: string[] = [];
  let current = start.slice(0, 5);
  while (current < end.slice(0, 5)) {
    slots.push(current);
    current = addMinutesToTime(current, slotMinutes);
  }
  return slots;
}

export function getWeekDays(reference: Date): Date[] {
  const start = startOfWeek(reference, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isToday(date: Date): boolean {
  return isSameDay(startOfDay(date), startOfDay(new Date()));
}

export function nowTimeString(): string {
  return format(new Date(), "HH:mm");
}
