import { MeiliSearch } from "meilisearch";

const url = process.env.NEXT_PUBLIC_MEILISEARCH_URL;
const apiKey = process.env.MEILI_MASTER_KEY;

if (!url) {
  throw new Error("Missing NEXT_PUBLIC_MEILISEARCH_URL");
}

export const meiliClient = new MeiliSearch({
  host: url,
  apiKey: apiKey,
});

export const PATIENTS_INDEX = "patients";

// Função para garantir que os settings de pesquisa e typo tolerance estejam no ponto ótimo
export async function setupMeiliIndex() {
  const index = meiliClient.index(PATIENTS_INDEX);
  
  await index.updateSearchableAttributes([
    "nm_paciente",
    "spp"
  ]);

  await index.updateFilterableAttributes([
    "cod_sexo"
  ]);

  await index.updateTypoTolerance({
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 3,
      twoTypos: 6,
    },
    disableOnWords: [],
    disableOnAttributes: ["spp"] // SPP é numérico exato, não queremos typo tolerance nele
  });
}
