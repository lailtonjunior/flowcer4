import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listBlocks } from "@/services/availability/actions";
import { listProfessionals } from "@/services/professionals/actions";
import { WEEKDAY_LABELS, formatDate, formatTime } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function BloqueiosPage() {
  const [blocks, professionals] = await Promise.all([
    listBlocks(),
    listProfessionals(),
  ]);
  const proMap = new Map(professionals.map((p) => [p.id, p]));

  return (
    <>
      <PageHeader
        title="Bloqueios"
        description="Visão consolidada dos horários bloqueados de todos os profissionais."
      />
      <Card>
        <CardContent className="p-0">
          {blocks.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Nenhum bloqueio cadastrado.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Quando</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blocks.map((b: any) => {
                  const pro = proMap.get(b.professional_id);
                  return (
                    <tr key={b.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: pro?.display_color }}
                          />
                          <span className="font-medium">{pro?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.recurring ? "Recorrente" : "Pontual"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.recurring
                          ? `Toda ${WEEKDAY_LABELS[b.weekday]}`
                          : formatDate(b.block_date)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTime(b.start_time)} – {formatTime(b.end_time)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
