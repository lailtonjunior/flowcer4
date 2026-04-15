"use client";
import { useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from "lucide-react";
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
import { reorderProfessionals } from "@/services/professionals/actions";
import type { Professional } from "@/types/database";
import { cn } from "@/lib/utils/cn";
import { getContrastText } from "@/lib/utils/colors";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  professionals: Professional[];
}

export function ProfessionalOrderDialog({
  open,
  onOpenChange,
  professionals,
}: Props) {
  const [items, setItems] = useState<Professional[]>(professionals);
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sempre que abrir o modal, ressincroniza com a lista vinda do servidor
  useEffect(() => {
    if (open) {
      setItems(professionals);
      setFilter("");
    }
  }, [open, professionals]);

  function move(id: string, direction: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function moveToTop(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }

  function moveToBottom(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
  }

  function reset() {
    setItems(professionals);
  }

  function sortAlpha() {
    setItems((prev) =>
      [...prev].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    );
  }

  function sortBySpecialty() {
    setItems((prev) =>
      [...prev].sort((a, b) => {
        const s = a.specialty.localeCompare(b.specialty, "pt-BR");
        return s !== 0 ? s : a.name.localeCompare(b.name, "pt-BR");
      })
    );
  }

  // ---------- Drag & drop nativo HTML5 ----------
  function handleDragStart(id: string, e: React.DragEvent) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(overId: string, e: React.DragEvent) {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setItems((prev) => {
      const fromIdx = prev.findIndex((p) => p.id === draggingId);
      const toIdx = prev.findIndex((p) => p.id === overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [m] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, m);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await reorderProfessionals(items.map((p) => p.id));
        toast.success("Ordem da grade atualizada");
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  const filtered = items.filter(
    (p) =>
      !filter ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.specialty.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ordem da grade</DialogTitle>
          <DialogDescription>
            Defina em que posição cada profissional aparece na coluna
            "Profissional / Setor" da agenda. Arraste para reordenar ou use
            as setas. A ordem é compartilhada por todas as visões.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrar..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={sortBySpecialty}>
              Agrupar por especialidade
            </Button>
            <Button variant="outline" size="sm" onClick={sortAlpha}>
              A → Z
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reverter
            </Button>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border scrollbar-thin">
          <ul className="divide-y divide-border">
            {filtered.map((p) => {
              const isDragging = draggingId === p.id;
              const idx = items.findIndex((x) => x.id === p.id);
              return (
                <li
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(p.id, e)}
                  onDragOver={(e) => handleDragOver(p.id, e)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 text-sm transition",
                    isDragging
                      ? "opacity-40"
                      : "hover:bg-muted/40 cursor-grab active:cursor-grabbing"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="w-8 text-center font-mono text-xs text-muted-foreground tabular-nums">
                    {idx + 1}
                  </span>
                  <div
                    className="flex-1 truncate rounded px-2 py-1"
                    style={{
                      background: p.display_color,
                      color: getContrastText(p.display_color),
                    }}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                      {p.specialty}
                    </span>
                    {" — "}
                    <span className="text-[12px]">{p.name}</span>
                    {!p.is_active && (
                      <span className="ml-2 rounded-full bg-black/20 px-1.5 text-[10px]">
                        inativo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Para o topo"
                      onClick={() => moveToTop(p.id)}
                      disabled={idx === 0}
                      className="h-7 w-7"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      <ArrowUp className="-ml-2 h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Subir"
                      onClick={() => move(p.id, -1)}
                      disabled={idx === 0}
                      className="h-7 w-7"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Descer"
                      onClick={() => move(p.id, 1)}
                      disabled={idx === items.length - 1}
                      className="h-7 w-7"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Para o fim"
                      onClick={() => moveToBottom(p.id)}
                      disabled={idx === items.length - 1}
                      className="h-7 w-7"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      <ArrowDown className="-ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-xs text-muted-foreground">
                Nenhum profissional encontrado para o filtro.
              </li>
            )}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar ordem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
