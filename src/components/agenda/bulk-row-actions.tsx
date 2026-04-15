"use client";
import { useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  bulkDeleteScheduleRows,
  countRowsAppointments,
} from "@/services/schedule/actions";

interface Props {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkRowActions({ selectedIds, onClear }: Props) {
  const [isPending, startTransition] = useTransition();

  if (selectedIds.length === 0) return null;

  async function handleBulkDelete() {
    let totalAppts = 0;
    try {
      totalAppts = await countRowsAppointments(selectedIds);
    } catch {
      // segue em frente, pergunta genérica
    }

    const header = `Excluir ${selectedIds.length} linha(s) da grade?`;
    const body =
      totalAppts > 0
        ? `\n\nHá ${totalAppts} agendamento(s) vinculado(s) no total.\n` +
          `OK  = apagar linhas E todos os ${totalAppts} agendamentos\n` +
          `Cancelar = não excluir nada`
        : "\n\nNenhum agendamento vinculado.";

    const ok = confirm(header + body);
    if (!ok) return;

    startTransition(async () => {
      try {
        const n = await bulkDeleteScheduleRows(selectedIds, {
          cascadeAppointments: totalAppts > 0,
        });
        toast.success(
          totalAppts > 0
            ? `${n} linha(s) e ${totalAppts} agendamento(s) removidos`
            : `${n} linha(s) removidas`
        );
        onClear();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2 text-sm">
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
          {selectedIds.length}
        </span>
        <span className="font-medium">linha(s) selecionada(s)</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
          {isPending ? "Excluindo..." : "Excluir selecionadas"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isPending}
        >
          <X className="h-4 w-4" /> Limpar seleção
        </Button>
      </div>
    </div>
  );
}
