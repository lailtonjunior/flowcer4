"use client";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  appointmentSchema,
  type AppointmentInput,
} from "@/lib/validators/appointment";
import {
  upsertAppointment,
  deleteAppointment,
} from "@/services/appointments/actions";
import { addMinutesToTime } from "@/lib/utils/dates";
import {
  APPOINTMENT_STATUS,
  STATUS_LABELS,
} from "@/lib/constants/status";
import type {
  AppointmentWithRelations,
  Patient,
  Professional,
} from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: AppointmentWithRelations | null;
  defaultDate: string;
  defaultStart?: string;
  defaultProfessionalId?: string;
  professionals: Professional[];
  patients: Patient[];
}

export function AppointmentDrawer({
  open,
  onOpenChange,
  initial,
  defaultDate,
  defaultStart,
  defaultProfessionalId,
  professionals,
  patients,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [patientSearch, setPatientSearch] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: initial
      ? {
          id: initial.id,
          professional_id: initial.professional_id,
          patient_id: initial.patient_id ?? undefined,
          appointment_date: initial.appointment_date,
          start_time: initial.start_time.slice(0, 5),
          end_time: initial.end_time.slice(0, 5),
          status: initial.status,
          notes: initial.notes ?? "",
        }
      : {
          professional_id: defaultProfessionalId ?? "",
          appointment_date: defaultDate,
          start_time: defaultStart ?? "08:00",
          end_time: addMinutesToTime(defaultStart ?? "08:00", 50),
          status: "scheduled",
        },
  });

  // Quando troca profissional, ajusta duração para o default dele
  const proId = watch("professional_id");
  const startTime = watch("start_time");
  const status = watch("status");

  useEffect(() => {
    if (!proId || initial) return;
    const pro = professionals.find((p) => p.id === proId);
    if (pro && startTime) {
      setValue("end_time", addMinutesToTime(startTime, pro.default_appointment_minutes));
    }
  }, [proId, startTime, professionals, setValue, initial]);

  const [livePatients, setLivePatients] = useState<Patient[]>(patients);

  useEffect(() => {
    const q = patientSearch.trim();
    if (q.length < 3) {
      setLivePatients(patients.slice(0, 50));
      return;
    }
    
    const timer = setTimeout(async () => {
      // Import the server action dynamically to avoid circular dependencies if any, 
      // but since we are in a client component we can just use the imported one.
      startTransition(async () => {
        try {
          const { listPatients } = await import("@/services/patients/actions");
          const res = await listPatients(q);
          setLivePatients(res);
        } catch (e) {
          console.error(e);
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [patientSearch, patients]);

  function onSubmit(data: AppointmentInput) {
    startTransition(async () => {
      try {
        await upsertAppointment(data);
        toast.success(initial ? "Agendamento atualizado" : "Agendamento criado");
        onOpenChange(false);
        reset();
      } catch (e) {
        toast.error("Não foi possível salvar", {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    });
  }

  function handleDelete() {
    if (!initial) return;
    if (!confirm("Excluir este agendamento?")) return;
    startTransition(async () => {
      try {
        await deleteAppointment(initial.id);
        toast.success("Agendamento excluído");
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar agendamento" : "Novo agendamento"}
          </DialogTitle>
          <DialogDescription>
            Selecione profissional, paciente e horário. Conflitos são validados
            no servidor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select
                value={watch("professional_id")}
                onValueChange={(v) => setValue("professional_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {professionals
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.specialty}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.professional_id && (
                <p className="text-xs text-destructive">
                  {errors.professional_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Paciente {status === "blocked" && "(opcional para bloqueio)"}</Label>
              <Input
                placeholder="Buscar por SPP ou nome..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              <Select
                value={watch("patient_id") ?? ""}
                onValueChange={(v) => setValue("patient_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {livePatients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.spp} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patient_id && (
                <p className="text-xs text-destructive">{errors.patient_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_date">Data</Label>
              <Input
                id="appointment_date"
                type="date"
                {...register("appointment_date")}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="start_time">Início</Label>
                <Input id="start_time" type="time" {...register("start_time")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Fim</Label>
                <Input id="end_time" type="time" {...register("end_time")} />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
          </div>

          <DialogFooter className="flex flex-row !justify-between">
            <div>
              {initial ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Excluir
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
