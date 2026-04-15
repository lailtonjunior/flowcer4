"use client";
import React, { useState, useEffect, useTransition } from "react";
import { Search, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Patient } from "@/types/database";

export function DraggablePatientSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const { listPatients } = await import("@/services/patients/actions");
          const patients = await listPatients(q);
          setResults(patients);
        } catch (e) {
          console.error(e);
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, patient: Patient) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "NEW_APPOINTMENT", patient }));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-full max-w-sm shrink-0 flex flex-col gap-2 relative z-50">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente (SPP ou Nome)..."
          className="pl-8 bg-surface"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isPending && (
          <span className="absolute right-3 top-3 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
        )}
      </div>

      {results.length > 0 && query.length >= 3 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-border rounded-md shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {results.map((p) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => handleDragStart(e, p)}
              className="flex items-center gap-2 p-2 border-b border-border last:border-0 hover:bg-muted/50 cursor-grab active:cursor-grabbing group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{p.name}</span>
                <span className="text-xs text-muted-foreground">SPP: {p.spp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
