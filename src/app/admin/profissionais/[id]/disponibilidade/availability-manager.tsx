"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  upsertAvailability,
  deleteAvailability,
} from "@/services/availability/actions";
import type { ProfessionalWeeklyAvailability } from "@/types/database";
import { WEEKDAY_LABELS, formatTime } from "@/lib/utils/dates";

interface Props {
  professionalId: string;
  defaultSlot: number;
  data: ProfessionalWeeklyAvailability[];
}

export function AvailabilityManager({ professionalId, defaultSlot, data }: Props) {
  const [isPending, startTransition] = useTransition();
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("18:00");
  const [slot, setSlot] = useState(String(defaultSlot));

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await upsertAvailability({
          professional_id: professionalId,
          weekday: Number(weekday),
          start_time: start,
          end_time: end,
          slot_minutes: Number(slot),
          is_active: true,
        });
        toast.success("Disponibilidade adicionada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover esta disponibilidade?")) return;
    startTransition(async () => {
      try {
        await deleteAvailability(id, professionalId);
        toast.success("Removido");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-md border border-dashed border-border p-3 sm:grid-cols-5"
      >
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Dia da semana</Label>
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAY_LABELS.map((label, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Início</Label>
          <Input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fim</Label>
          <Input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slot (min)</Label>
          <Input
            type="number"
            min={5}
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          />
        </div>
        <div className="sm:col-span-5">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </form>

      {data.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Nenhuma disponibilidade cadastrada.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {data.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="font-medium">{WEEKDAY_LABELS[a.weekday]}</span>
              <span className="text-muted-foreground">
                {formatTime(a.start_time)} – {formatTime(a.end_time)} ({a.slot_minutes}{" "}
                min)
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(a.id)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
