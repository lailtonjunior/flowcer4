"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, Pencil, Settings2, Power, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ProfessionalForm,
  useProfessionalDialog,
} from "@/components/admin/professional-form";
import {
  deleteProfessional,
  bulkDeactivateProfessionals,
  syncProfessionalsFromSigh,
} from "@/services/professionals/actions";
import type { Professional } from "@/types/database";

export function ProfessionalsTable({ data }: { data: Professional[] }) {
  const dialog = useProfessionalDialog();
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = data.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.specialty.toLowerCase().includes(filter.toLowerCase())
  );

  const allFilteredIds = filtered.map((p) => p.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allFilteredIds));
    }
  }

  function handleDeactivate(id: string) {
    if (!confirm("Inativar este profissional? O histórico será preservado.")) return;
    startTransition(async () => {
      try {
        await deleteProfessional(id);
        toast.success("Profissional inativado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function handleBulkDeactivate() {
    const activeSelected = [...selected].filter((id) => {
      const p = data.find((d) => d.id === id);
      return p?.is_active;
    });
    if (activeSelected.length === 0) {
      toast.info("Nenhum profissional ativo selecionado.");
      return;
    }
    if (!confirm(`Inativar ${activeSelected.length} profissional(is) selecionado(s)?`)) return;
    startTransition(async () => {
      try {
        const res = await bulkDeactivateProfessionals(activeSelected);
        toast.success(`${res.count} profissional(is) inativado(s).`);
        setSelected(new Set());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function handleSync() {
    startTransition(async () => {
      try {
        const res = await syncProfessionalsFromSigh();
        toast.success(`${res.count} profissionais sincronizados do SIGH!`, {
          description: res.specialties?.length
            ? `Especialidades: ${res.specialties.join(", ")}`
            : undefined,
          duration: 8000,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao sincronizar SIGH");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-border p-4">
        <Input
          placeholder="Buscar por nome ou especialidade..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {someSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeactivate}
              disabled={isPending}
            >
              <Power className="h-4 w-4 mr-1" />
              Inativar ({selected.size})
            </Button>
          )}
          <Button variant="outline" onClick={handleSync} disabled={isPending}>
            Sincronizar do SIGH
          </Button>
          <Button onClick={dialog.openCreate}>
            <Plus className="h-4 w-4" />
            Novo profissional
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhum profissional encontrado.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
                />
              </th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Especialidade</th>
              <th className="px-4 py-3">Sala</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-muted/30 transition-colors ${selected.has(p.id) ? "bg-accent/5" : ""}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ background: p.display_color }}
                    />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.specialty}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.room || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.default_appointment_minutes} min
                </td>
                <td className="px-4 py-3">
                  {p.is_active ? (
                    <Badge className="border-success/40 bg-success/10 text-success">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge className="border-border bg-muted text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/profissionais/${p.id}/disponibilidade`}>
                      <Button variant="ghost" size="icon" title="Disponibilidade">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      onClick={() => dialog.openEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Inativar"
                      disabled={isPending || !p.is_active}
                      onClick={() => handleDeactivate(p.id)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ProfessionalForm
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        initial={dialog.editing}
      />
    </>
  );
}
