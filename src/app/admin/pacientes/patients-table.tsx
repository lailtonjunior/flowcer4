"use client";
import { useState, useTransition, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PatientForm,
  usePatientDialog,
} from "@/components/admin/patient-form";
import { deletePatient } from "@/services/patients/actions";
import type { Patient } from "@/types/database";
import { formatDate } from "@/lib/utils/dates";

export function PatientsTable({ data, initialSearch }: { data: Patient[], initialSearch?: string }) {
  const dialog = usePatientDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filter, setFilter] = useState(initialSearch ?? "");
  const [isPending, startTransition] = useTransition();

  // Debounce the input and then push to url so the server fetches from SIGH
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = filter.trim();
      const params = new URLSearchParams(searchParams);
      if (q) params.set("q", q);
      else params.delete("q");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [filter, pathname, router, searchParams]);

  function handleDelete(id: string) {
    if (!confirm("Excluir paciente? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      try {
        await deletePatient(id);
        toast.success("Paciente excluído");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-border p-4">
        <Input
          placeholder="Buscar no SIGH (mínimo 3 letras)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={dialog.openCreate}>
          <Plus className="h-4 w-4" />
          Novo paciente
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhum paciente encontrado.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">SPP</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Nascimento</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-accent">
                  {p.spp}
                </td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.birth_date ? formatDate(p.birth_date) : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.guardian_name || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.phone || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dialog.openEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <PatientForm
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        initial={dialog.editing}
      />
    </>
  );
}
