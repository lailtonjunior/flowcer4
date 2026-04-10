"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, Pencil, Settings2, Power, Trash2 } from "lucide-react";
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
} from "@/services/professionals/actions";
import type { Professional } from "@/types/database";

export function ProfessionalsTable({ data }: { data: Professional[] }) {
  const dialog = useProfessionalDialog();
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = data.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.specialty.toLowerCase().includes(filter.toLowerCase())
  );

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

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-border p-4">
        <Input
          placeholder="Buscar por nome ou especialidade..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={dialog.openCreate}>
          <Plus className="h-4 w-4" />
          Novo profissional
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhum profissional encontrado.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
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
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
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
