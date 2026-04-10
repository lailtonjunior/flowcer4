import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const { admin } = await requireAdmin();

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Identidade da clínica, paleta visual e dados do administrador."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Administrador atual</CardTitle>
            <CardDescription>
              Sessão autenticada via Supabase Auth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nome:</span>{" "}
              <strong>{admin.name}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">E-mail:</span>{" "}
              <strong>{admin.email}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paleta visual</CardTitle>
            <CardDescription>
              Tokens semânticos derivados de navy / aqua / teal / sand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: "Navy", color: "#0B1F3A" },
                { name: "Teal", color: "#1F8A8F" },
                { name: "Aqua", color: "#5BD1D7" },
                { name: "Sand", color: "#F2EAD3" },
              ].map((c) => (
                <div key={c.name} className="text-center">
                  <div
                    className="mb-1 h-16 rounded-md border border-border"
                    style={{ background: c.color }}
                  />
                  <p className="text-xs font-medium">{c.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {c.color}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
