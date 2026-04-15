"use client";
import React, { useState, useEffect, useRef, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { Patient } from "@/types/database";

interface Props {
  professionalId: string;
  appointmentDate: string;
  slot: string;
  onBooked?: () => void;
}

export function InlinePatientSearch({
  professionalId,
  appointmentDate,
  slot,
  onBooked,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { listPatients } = await import("@/services/patients/actions");
        const patients = await listPatients(q);
        setResults(patients);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [query]);

  function selectPatient(patient: Patient) {
    startTransition(async () => {
      try {
        const { upsertAppointment } = await import("@/services/appointments/actions");
        // Calculate end_time = slot + 40 min default
        const [h, m] = slot.split(":").map(Number);
        const totalMin = h * 60 + m + 40;
        const endH = String(Math.floor(totalMin / 60)).padStart(2, "0");
        const endM = String(totalMin % 60).padStart(2, "0");

        await upsertAppointment({
          professional_id: professionalId,
          patient_id: patient.id,
          appointment_date: appointmentDate,
          start_time: `${slot}:00`,
          end_time: `${endH}:${endM}:00`,
          status: "scheduled",
          notes: "",
        });

        // Clear the search field
        setQuery("");
        setResults([]);
        setShowDropdown(false);
        onBooked?.();
      } catch (error: any) {
        console.error("Erro ao agendar:", error);
        toast.error("Não foi possível agendar", {
          description: error?.message || "Tente novamente.",
        });
        // Em caso de erro, fecha o dropdown "zumbi" e limpa o input:
        setQuery("");
        setResults([]);
        setShowDropdown(false);
      }
    });
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="+ paciente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          onBlur={() => {
            // delay pra permitir o click em um item do dropdown
            setTimeout(() => setShowDropdown(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowDropdown(false);
              setQuery("");
              (e.target as HTMLInputElement).blur();
            }
          }}
          disabled={isPending}
          className="w-full pl-5 pr-2 py-1 text-[10px] bg-transparent border border-dashed border-border/50 rounded-sm
                     focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30
                     placeholder:text-muted-foreground/40 text-foreground
                     transition-all hover:border-muted-foreground/40 disabled:opacity-50"
        />
        {isSearching && (
          <span className="absolute right-1 top-1/2 -translate-y-1/2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 w-56 mt-0.5 bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-40 overflow-y-auto text-xs">
          {results.slice(0, 10).map((p) => (
            <button
              key={p.id}
              onClick={() => selectPatient(p)}
              disabled={isPending}
              className="flex flex-col w-full p-1.5 hover:bg-accent/10 text-left border-b border-border/30 last:border-0 transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-foreground truncate">{p.name}</span>
              <span className="text-[9px] text-muted-foreground">SPP: {p.spp}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
