"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Eraser, Search, UserPlus } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { assignProfessional } from "@/services/schedule/actions";
import type { Professional } from "@/types/database";
import { cn } from "@/lib/utils/cn";
import { getContrastText } from "@/lib/utils/colors";

interface Props {
  slotId: string;
  current: Pick<
    Professional,
    "id" | "name" | "specialty" | "display_color" | "room"
  > | null;
  professionals: Professional[];
}

export function InlineProfessionalSearch({
  slotId,
  current,
  professionals,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = professionals
    .filter((p) => p.is_active)
    .filter((p) => {
      const q = query.toLowerCase().trim();
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q)
      );
    })
    .slice(0, 25);

  function handleAssign(pid: string | null) {
    startTransition(async () => {
      try {
        await assignProfessional(slotId, pid);
        toast.success(pid ? "Profissional atribuído" : "Linha esvaziada");
        setOpen(false);
        setQuery("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          title="Atribuir profissional a esta linha"
          className={cn(
            "group/cell w-full text-left px-2 py-1 transition",
            !current && "border border-dashed border-border bg-muted/30 rounded"
          )}
          style={
            current
              ? {
                  background: current.display_color,
                  color: getContrastText(current.display_color),
                }
              : undefined
          }
        >
          {current ? (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-[11px] truncate uppercase tracking-wide">
                {current.specialty}
              </span>
              <span className="text-[10px] truncate opacity-90" title={current.name}>
                {current.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              <span className="text-[11px]">Atribuir</span>
            </div>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-72 rounded-md border border-border bg-surface shadow-lg"
        >
          <div className="space-y-2 p-2">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar profissional..."
                className="h-8 text-sm"
              />
            </div>

            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Nenhum profissional encontrado.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleAssign(p.id)}
                        disabled={isPending}
                        className={cn(
                          "flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-muted",
                          current?.id === p.id && "bg-muted/60 font-semibold"
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: p.display_color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {p.specialty}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {current && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAssign(null)}
                disabled={isPending}
                className="w-full justify-start text-xs text-destructive hover:bg-destructive/10"
              >
                <Eraser className="h-3.5 w-3.5" /> Esvaziar linha
              </Button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
