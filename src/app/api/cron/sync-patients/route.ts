import { NextResponse } from "next/server";
import { querySigh } from "@/lib/db/sigh";
import { meiliClient, PATIENTS_INDEX, setupMeiliIndex } from "@/services/meilisearch/client";

/**
 * Route: POST /api/cron/sync-patients
 * Description: Sincroniza periodicamente todos os pacientes do Postgres SIGH legado
 *              para o banco in-memory do Meilisearch.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Busca todos do SIGH 
    // Em hospitais reais, isso pode ter centenas de milhares de registros,
    // podendo ser ajustado no futuro com LIMIT/OFFSET Pagination. 
    // Para nosso modelo CER4 local, traremos os colunas chaves.
    const query = `
      SELECT spp, nm_paciente, cod_sexo, data_nasc, pai, mae
      FROM sigh.pacientes
      WHERE nm_paciente IS NOT NULL
    `;
    
    const records = await querySigh<any>(query);

    if (!records || records.length === 0) {
      return NextResponse.json({ ok: false, error: "Nenhum paciente encontrado no SIGH." });
    }

    // O Meilisearch requer um identificador único contido no documento com nome chave, 
    // tipicamente 'id'. Transformaremos o 'spp' no 'id' interno da busca.
    const documents = records.map((r: any) => ({
      id: r.spp.toString(),
      spp: r.spp.toString(),
      nm_paciente: r.nm_paciente,
      cod_sexo: r.cod_sexo,
      data_nasc: r.data_nasc,
      pai: r.pai,
      mae: r.mae
    }));

    // 2. Setup do Índice (garante typo tolerance e configs de busca na 1a execução)
    await setupMeiliIndex();

    // 3. Batelada pro motor de text-search
    const task = await meiliClient.index(PATIENTS_INDEX).addDocuments(documents);

    return NextResponse.json({
      ok: true,
      numberOfDocuments: documents.length,
      taskUid: task.taskUid,
      isIndexing: true, // Indica que a batelada foi engatilhada.
      message: "Sync enviado ao Meilisearch com sucesso!"
    });

  } catch (error: any) {
    console.error("[CRON] Erro ao sincronizar pacientes no Meili:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Apenas utilitário para verificarmos como anda a saúde do índice via curl
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const stats = await meiliClient.index(PATIENTS_INDEX).getStats();
    return NextResponse.json({ ok: true, stats });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
