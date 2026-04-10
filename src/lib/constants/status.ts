export const APPOINTMENT_STATUS = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "blocked",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Falta",
  blocked: "Bloqueado",
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-aqua-100 text-navy-700 border-aqua-300",
  confirmed: "bg-teal-100 text-teal-800 border-teal-400",
  completed: "bg-sand-200 text-navy-600 border-sand-400",
  cancelled: "bg-red-100 text-red-700 border-red-300",
  no_show: "bg-yellow-100 text-yellow-800 border-yellow-300",
  blocked: "bg-navy-100 text-navy-700 border-navy-300",
};

export const STATUS_DOT: Record<AppointmentStatus, string> = {
  scheduled: "bg-aqua-400",
  confirmed: "bg-teal-500",
  completed: "bg-sand-500",
  cancelled: "bg-red-500",
  no_show: "bg-yellow-500",
  blocked: "bg-navy-500",
};
