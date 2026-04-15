"use client";
import { useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addScheduleRow,
  countRowAppointments,
  deleteScheduleRow,
} from "@/services/schedule/actions";

export function AddRowButton({ startTime }: { startTime: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await addScheduleRow({ startTime });
        toast.success(`Nova linha criada (posição ${res.position}). Atribua um profissional.`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="h-6 w-full justify-center gap-1 text-[11px] text-muted-foreground hover:bg-muted/40"
    >
      <Plus className="h-3 w-3" /> Adicionar linha em {startTime}
    </Button>
  );
}

export function DeleteRowButton({ slotId }: { slotId: string }) {
  const [isPending, startTransition] = useTransition();

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    // 1. Conta agendamentos vinculados
    let count = 0;
    try {
      count = await countRowAppointments(slotId);
    } catch {
      // segue com count=0 — ainda mostra confirm
    }

    let cascade = false;
    if (count > 0) {
      const ok = confirm(
        `Esta linha tem ${count} agendamento(s) vinculado(s).\n\n` +
          `Excluir a linha E todos os agendamentos? (Cancelar mantém tudo.)`
      );
      if (!ok) return;
      cascade = true;
    } else {
      const ok = confirm("Excluir esta linha?");
      if (!ok) return;
    }

    startTransition(async () => {
      try {
        await deleteScheduleRow(slotId, { cascadeAppointments: cascade });
        toast.success(
          cascade
            ? `Linha e ${count} agendamento(s) removidos`
            : "Linha removida"
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Excluir linha (e agendamentos)"
      className="rounded p-0.5 text-white/80 hover:bg-black/20 hover:text-white disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );
}
