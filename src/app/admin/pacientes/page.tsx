import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { listPatients } from "@/services/patients/actions";
import { PatientsTable } from "./patients-table";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function PacientesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const patients = await listPatients(sp.q);
  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Pesquisa direta na base do SIGH."
      />
      <Card className="overflow-hidden">
        <PatientsTable data={patients} initialSearch={sp.q} />
      </Card>
    </>
  );
}
