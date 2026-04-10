import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listProfessionals } from "@/services/professionals/actions";
import { ProfessionalsTable } from "./professionals-table";

export const dynamic = "force-dynamic";

export default async function ProfissionaisPage() {
  const professionals = await listProfessionals();

  return (
    <>
      <PageHeader
        title="Profissionais"
        description="Cadastre e gerencie os profissionais que atendem na clínica."
      />
      <Card className="overflow-hidden">
        <ProfessionalsTable data={professionals} />
      </Card>
    </>
  );
}
