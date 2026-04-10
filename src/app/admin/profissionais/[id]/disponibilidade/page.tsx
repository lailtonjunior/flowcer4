import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";
import {
  listAvailability,
  listBlocks,
} from "@/services/availability/actions";
import type { Professional } from "@/types/database";
import { AvailabilityManager } from "./availability-manager";
import { BlocksManager } from "./blocks-manager";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DisponibilidadePage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!pro) notFound();
  const professional = pro as Professional;

  const [availability, blocks] = await Promise.all([
    listAvailability(id),
    listBlocks(id),
  ]);

  return (
    <>
      <Link href="/admin/profissionais">
        <Button variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>
      <PageHeader
        title={`Disponibilidade — ${professional.name}`}
        description={`${professional.specialty}${professional.room ? ` • ${professional.room}` : ""}`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agenda semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityManager
              professionalId={professional.id}
              defaultSlot={professional.default_appointment_minutes}
              data={availability}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bloqueios</CardTitle>
          </CardHeader>
          <CardContent>
            <BlocksManager
              professionalId={professional.id}
              data={blocks as any}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
