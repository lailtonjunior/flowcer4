"use client";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addScheduleRow } from "@/services/schedule/actions";
import { addMinutesToTime } from "@/lib/utils/dates";
import type { Professional } from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  professionals: Professional[];
  /** "morning" | "afternoon" — só para sugerir um horário padrão inicial */
  period?: "morning" | "afternoon";
}

export function AddTimeSlotDialog({
  open,
  onOpenChange,
  professionals,
  period,
}: Props) {
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:40");
  const [professionalId, setProfessionalId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Ao abrir, reseta campos com defaults coerentes com o período
  useEffect(() => {
    if (!open) return;
    const defaultStart = period === "afternoon" ? "13:30" : "08:00";
    setStartTime(defaultStart);
    setEndTime(addMinutesToTime(defaultStart, 40));
    setProfessionalId("");
  }, [open, period]);

  // Quando o usuário muda start, recomputa end = start + 40
  function handleStartChange(v: string) {
    setStartTime(v);
    try {
      setEndTime(addMinutesToTime(v, 40));
    } catch {
      // ignora formato inválido durante digitação
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      toast.error("Informe horários válidos (HH:MM).");
      return;
    }
    if (endTime <= startTime) {
      toast.error("Horário final deve ser maior que o inicial.");
      return;
    }

    startTransition(async () => {
      try {
        await addScheduleRow({
          startTime,
          endTime,
          professionalId: professionalId || null,
        });
        toast.success(`Linha criada em ${startTime}`);
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo horário na grade</DialogTitle>
          <DialogDescription>
            Adiciona uma nova linha no template. Se já existirem linhas neste
            horário, a nova será posicionada por último.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_time">Início</Label>
              <Input
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Fim</Label>
              <Input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profissional (opcional)</Label>
            <Select
              value={professionalId}
              onValueChange={(v) => setProfessionalId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Deixar em branco (atribuir depois)" />
              </SelectTrigger>
              <SelectContent>
                {professionals
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: p.display_color }}
                        />
                        {p.name} — {p.specialty}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Você também pode atribuir depois clicando na célula da linha.
            </p>
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
              {isPending ? "Criando..." : "Criar linha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
