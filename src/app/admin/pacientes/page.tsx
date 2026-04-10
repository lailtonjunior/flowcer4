import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { listPatients } from "@/services/patients/actions";
import { PatientsTable } from "./patients-table";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const patients = await listPatients();
  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Cadastro de pacientes com SPP único."
      />
      <Card className="overflow-hidden">
        <PatientsTable data={patients} />
      </Card>
    </>
  );
}
