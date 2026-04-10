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
import { upsertBlock, deleteBlock } from "@/services/availability/actions";
import { WEEKDAY_LABELS, formatDate, formatTime } from "@/lib/utils/dates";
import type { ProfessionalBlock } from "@/types/database";

export function BlocksManager({
  professionalId,
  data,
}: {
  professionalId: string;
  data: ProfessionalBlock[];
}) {
  const [isPending, startTransition] = useTransition();
  const [recurring, setRecurring] = useState(false);
  const [weekday, setWeekday] = useState("1");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("13:00");
  const [reason, setReason] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await upsertBlock({
          professional_id: professionalId,
          recurring,
          weekday: recurring ? Number(weekday) : null,
          block_date: recurring ? null : date || null,
          start_time: start,
          end_time: end,
          reason: reason || null,
        });
        toast.success("Bloqueio adicionado");
        setReason("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover este bloqueio?")) return;
    startTransition(async () => {
      try {
        await deleteBlock(id);
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
        className="space-y-3 rounded-md border border-dashed border-border p-3"
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          Bloqueio recorrente (semanal)
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {recurring ? (
            <div className="space-y-1">
              <Label className="text-xs">Dia</Label>
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
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required={!recurring}
              />
            </div>
          )}
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
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Motivo</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: Almoço, Reunião, Folga"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          <Plus className="h-4 w-4" /> Adicionar bloqueio
        </Button>
      </form>

      {data.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum bloqueio cadastrado.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {data.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {b.recurring
                    ? `Toda ${WEEKDAY_LABELS[b.weekday ?? 0]}`
                    : b.block_date
                      ? formatDate(b.block_date)
                      : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  {b.reason ? ` • ${b.reason}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(b.id)}
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
