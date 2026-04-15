import "server-only";
import { querySigh } from "@/lib/db/sigh";
import {
  PATIENTS_INDEX,
  ensurePatientsIndex,
  getMeiliClient,
} from "@/services/meilisearch/client";

interface SighPatientRow {
  id_paciente: number;
  spp: string | number | null;
  nm_paciente: string;
  data_nasc: string | Date | null;
}

export interface PatientSyncResult {
  count: number;
  durationMs: number;
  taskUid: number | null;
  indexedAt: string;
}

/**
 * Lê todos os pacientes do SIGH (leitura simples, NÃO trava a base) e
 * faz `addDocuments` em lote no Meilisearch. O index é o "search engine
 * de produção" que a UI consulta — o SIGH passa a ser fonte de verdade
 * apenas para esta sync periódica.
 *
 * `batchSize` controla o tamanho de cada `addDocuments` enviado ao Meili —
 * default 5000 (Meilisearch absorve dezenas de milhares por segundo).
 */
export async function syncPatientsToMeili(
  opts: { batchSize?: number; sighWhereExtra?: string } = {}
): Promise<PatientSyncResult> {
  const batchSize = opts.batchSize ?? 5000;
  const startedAt = Date.now();

  const index = await ensurePatientsIndex();

  const sql = `
    SELECT id_paciente, spp, nm_paciente, data_nasc
    FROM sigh.pacientes
    WHERE nm_paciente IS NOT NULL
      AND nm_paciente <> ''
      ${opts.sighWhereExtra ?? ""}
  `;
  const rows = await querySigh<SighPatientRow>(sql);

  if (rows.length === 0) {
    return {
      count: 0,
      durationMs: Date.now() - startedAt,
      taskUid: null,
      indexedAt: new Date().toISOString(),
    };
  }

  // Normaliza para o schema do índice
  const docs = rows
    .filter((r) => r.spp || r.id_paciente)
    .map((r) => ({
      spp: r.spp ? String(r.spp) : String(r.id_paciente),
      name: r.nm_paciente,
      birth_date: r.data_nasc
        ? new Date(r.data_nasc).toISOString().split("T")[0]
        : null,
    }));

  // Sobe em batches; cada chamada cria uma task assíncrona no Meili
  let lastTaskUid: number | null = null;
  for (let i = 0; i < docs.length; i += batchSize) {
    const slice = docs.slice(i, i + batchSize);
    const task = await index.addDocuments(slice, { primaryKey: "spp" });
    lastTaskUid = task.taskUid;
  }

  return {
    count: docs.length,
    durationMs: Date.now() - startedAt,
    taskUid: lastTaskUid,
    indexedAt: new Date().toISOString(),
  };
}

/** Estatísticas leves do índice — útil para healthcheck/debug. */
export async function getPatientsIndexStats() {
  const client = getMeiliClient();
  const index = client.index(PATIENTS_INDEX);
  const stats = await index.getStats();
  return {
    numberOfDocuments: stats.numberOfDocuments,
    isIndexing: stats.isIndexing,
  };
}
