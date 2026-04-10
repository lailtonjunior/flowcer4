"use client";
import { useState, useTransition } from "react";
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
import { patientSchema, type PatientInput } from "@/lib/validators/patient";
import { upsertPatient } from "@/services/patients/actions";
import type { Patient } from "@/types/database";

export function PatientForm({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Patient | null;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: initial
      ? {
          id: initial.id,
          spp: initial.spp,
          name: initial.name,
          birth_date: initial.birth_date ?? "",
          guardian_name: initial.guardian_name ?? "",
          phone: initial.phone ?? "",
          notes: initial.notes ?? "",
        }
      : { spp: "", name: "" },
  });

  function onSubmit(data: PatientInput) {
    startTransition(async () => {
      try {
        await upsertPatient(data);
        toast.success(initial ? "Paciente atualizado" : "Paciente criado");
        onOpenChange(false);
        reset();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar paciente" : "Novo paciente"}
          </DialogTitle>
          <DialogDescription>
            O SPP é o número único de prontuário do paciente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="spp">SPP (prontuário)</Label>
              <Input id="spp" {...register("spp")} placeholder="SPP-1234" />
              {errors.spp && (
                <p className="text-xs text-destructive">{errors.spp.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="guardian_name">Responsável</Label>
              <Input id="guardian_name" {...register("guardian_name")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function usePatientDialog() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  return {
    open,
    editing,
    setOpen,
    openCreate: () => {
      setEditing(null);
      setOpen(true);
    },
    openEdit: (p: Patient) => {
      setEditing(p);
      setOpen(true);
    },
  };
}
