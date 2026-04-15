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
  professionalSchema,
  type ProfessionalInput,
} from "@/lib/validators/professional";
import { upsertProfessional } from "@/services/professionals/actions";
import type { Professional } from "@/types/database";
import {
  CANONICAL_SPECIALTIES,
  DEFAULT_SPECIALTY_COLOR,
  getSpecialtyColor,
} from "@/lib/constants/specialty-colors";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Professional | null;
}

// Ordem canônica: as 7 principais primeiro, depois as demais em ordem alfabética.
const SPECIALTY_OPTIONS = [
  ...CANONICAL_SPECIALTIES.slice(0, 7),
  ...CANONICAL_SPECIALTIES.slice(7).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  ),
];

export function ProfessionalForm({ open, onOpenChange, initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfessionalInput>({
    resolver: zodResolver(professionalSchema),
    defaultValues: initial
      ? {
          id: initial.id,
          name: initial.name,
          specialty: initial.specialty,
          display_color: initial.display_color,
          room: initial.room ?? "",
          default_appointment_minutes: initial.default_appointment_minutes,
          is_active: initial.is_active,
          notes: initial.notes ?? "",
        }
      : {
          name: "",
          specialty: "Geral",
          display_color: DEFAULT_SPECIALTY_COLOR,
          room: "",
          default_appointment_minutes: 50,
          is_active: true,
          notes: "",
        },
  });

  const specialty = watch("specialty");
  const displayColor = watch("display_color");

  // Cor segue a especialidade automaticamente (a menos que o usuário tenha
  // tocado o seletor de cor após escolher a especialidade).
  const [colorLocked, setColorLocked] = useState(true);
  useEffect(() => {
    if (!colorLocked) return;
    if (!specialty) return;
    const auto = getSpecialtyColor(specialty);
    if (auto !== displayColor) {
      setValue("display_color", auto, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty, colorLocked]);

  function onSubmit(data: ProfessionalInput) {
    startTransition(async () => {
      try {
        await upsertProfessional(data);
        toast.success(initial ? "Profissional atualizado" : "Profissional criado");
        onOpenChange(false);
        reset();
      } catch (e) {
        toast.error("Erro", {
          description: e instanceof Error ? e.message : "Tente novamente",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar profissional" : "Novo profissional"}
          </DialogTitle>
          <DialogDescription>
            A cor segue a especialidade automaticamente — assim todos os
            profissionais da mesma modalidade compartilham a mesma identidade
            visual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Select
                value={specialty}
                onValueChange={(v) => {
                  setColorLocked(true);
                  setValue("specialty", v, { shouldDirty: true });
                }}
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: getSpecialtyColor(s) }}
                        />
                        {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-xs text-destructive">{errors.specialty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Sala / Unidade</Label>
              <Input id="room" {...register("room")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_color">Cor de destaque</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="display_color"
                  type="color"
                  className="h-10 w-16 cursor-pointer p-1"
                  {...register("display_color", {
                    onChange: () => setColorLocked(false),
                  })}
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {displayColor}
                </span>
                {!colorLocked && (
                  <button
                    type="button"
                    className="text-[11px] text-accent underline"
                    onClick={() => {
                      setColorLocked(true);
                      setValue("display_color", getSpecialtyColor(specialty), {
                        shouldDirty: true,
                      });
                    }}
                  >
                    usar cor da especialidade
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {colorLocked
                  ? "Vinculada à especialidade"
                  : "Personalizada (sobrescreve o padrão)"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_appointment_minutes">
                Duração padrão (min)
              </Label>
              <Input
                id="default_appointment_minutes"
                type="number"
                min={5}
                max={480}
                {...register("default_appointment_minutes")}
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="is_active"
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                {...register("is_active")}
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações internas</Label>
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

export function useProfessionalDialog() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  return {
    open,
    editing,
    openCreate: () => {
      setEditing(null);
      setOpen(true);
    },
    openEdit: (p: Professional) => {
      setEditing(p);
      setOpen(true);
    },
    setOpen,
  };
}
