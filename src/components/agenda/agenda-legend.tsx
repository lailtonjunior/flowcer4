"use client";
import { useMemo } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Professional } from "@/types/database";

interface SpecialtyEntry {
  name: string;
  color: string;
  count: number;
}

interface Props {
  professionals: Professional[];
  hiddenSpecialties: Set<string>;
  onToggleSpecialty: (name: string) => void;
  onReset: () => void;
  onSoloSpecialty: (name: string) => void;
}

export function AgendaLegend({
  professionals,
  hiddenSpecialties,
  onToggleSpecialty,
  onReset,
  onSoloSpecialty,
}: Props) {
  const specialties = useMemo<SpecialtyEntry[]>(() => {
    const map = new Map<string, SpecialtyEntry>();
    for (const p of professionals.filter((p) => p.is_active)) {
      const entry = map.get(p.specialty);
      if (entry) {
        entry.count += 1;
      } else {
        map.set(p.specialty, {
          name: p.specialty,
          color: p.display_color,
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  }, [professionals]);

  if (specialties.length === 0) return null;

  const anyHidden = hiddenSpecialties.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
      <span className="mr-1 font-semibold uppercase tracking-wider text-muted-foreground">
        Especialidades
      </span>

      {specialties.map((s) => {
        const isHidden = hiddenSpecialties.has(s.name);
        return (
          <button
            key={s.name}
            onClick={() => onToggleSpecialty(s.name)}
            onDoubleClick={() => onSoloSpecialty(s.name)}
            title={`Clique: mostrar/ocultar  •  Duplo clique: ver apenas ${s.name}`}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition",
              isHidden
                ? "border-dashed border-border bg-muted/30 text-muted-foreground opacity-60 hover:opacity-90"
                : "border-border bg-muted/50 text-foreground hover:bg-muted"
            )}
            style={
              isHidden
                ? undefined
                : {
                    borderLeftColor: s.color,
                    borderLeftWidth: 3,
                  }
            }
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isHidden && "opacity-30"
              )}
              style={{ background: s.color }}
            />
            <span className="font-medium">{s.name}</span>
            <span className="ml-0.5 rounded-full bg-background/60 px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {s.count}
            </span>
            {isHidden ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3 opacity-0 group-hover:opacity-60" />
            )}
          </button>
        );
      })}

      {anyHidden && (
        <button
          onClick={onReset}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted"
        >
          <RotateCcw className="h-3 w-3" /> Mostrar todas
        </button>
      )}
    </div>
  );
}
