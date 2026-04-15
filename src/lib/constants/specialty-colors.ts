/**
 * Mapa de cores por modalidade/especialidade.
 * Todos os profissionais da mesma especialidade compartilham a mesma cor.
 *
 * Paleta canônica das 7 modalidades principais do CER4
 * (conforme padrão visual da equipe):
 *
 *   Fisioterapia      → azul
 *   Fonoaudiologia    → verde
 *   Psicologia        → vermelho
 *   Educação Física   → preto
 *   Musicoterapia     → roxo
 *   Nutrição          → magenta
 *   Pedagogia         → laranja
 *
 * Aliases (Fisioterapeuta, Fono, etc.) apontam para a mesma cor para
 * suportar tanto os nomes vindos do SIGH quanto cadastros manuais.
 */
export const SPECIALTY_COLORS: Record<string, string> = {
  // ===== 7 modalidades principais =====
  "Fisioterapia":     "#2563EB", // azul
  "Fisioterapeuta":   "#2563EB",
  "FISIO":            "#2563EB",

  "Fonoaudiologia":   "#16A34A", // verde
  "Fonoaudiólogo":    "#16A34A",
  "FONO":             "#16A34A",

  "Psicologia":       "#DC2626", // vermelho
  "Psicólogo":        "#DC2626",
  "PSICO":            "#DC2626",

  "Educação Física":  "#111827", // preto
  "Educador Físico":  "#111827",
  "ED. FÍSICO":       "#111827",

  "Musicoterapia":    "#9333EA", // roxo
  "Musicoterapeuta":  "#9333EA",

  "Nutrição":         "#C026D3", // magenta
  "Nutricionista":    "#C026D3",

  "Pedagogia":        "#EA580C", // laranja
  "Pedagoga":         "#EA580C",
  "Pedagogo":         "#EA580C",

  // ===== Modalidades secundárias (mantêm tons distintos) =====
  "Terapia Ocupacional":    "#0EA5A4", // teal
  "Serviço Social":         "#F472B6", // rosa claro
  "Assistente Social":      "#F472B6",
  "Enfermagem":             "#F59E0B", // âmbar
  "Técnico em Enfermagem":  "#F59E0B",
  "Clínico Geral":          "#0891B2", // ciano
  "Generalista":            "#0891B2",
  "Fisiatra":               "#1E40AF", // azul escuro
  "Fisiatria":              "#1E40AF",
  "Neurologista":           "#7C3AED", // violeta
  "Neuropediatra":          "#7C3AED",
  "Ortopedista":            "#475569", // grafite
  "Ortopedia":              "#475569",
  "Psiquiatra":             "#5B21B6", // roxo escuro
  "Psiquiatria":            "#5B21B6",
  "Pediatra":               "#0D9488", // verde-azulado
  "Otorrinolaringologista": "#BE185D", // rosa queimado
  "Otorrinolaringologia":   "#BE185D",
  "Oftalmologista":         "#D4A017", // ocre
  "Oftalmologia":           "#D4A017",

  // Fallback genérico
  "Geral":                  "#64748B", // slate
};

/**
 * Lista canônica para uso em selects/legendas — apenas os nomes longos,
 * sem aliases. Mantém a ordem das 7 principais primeiro.
 */
export const CANONICAL_SPECIALTIES = [
  "Fisioterapia",
  "Fonoaudiologia",
  "Psicologia",
  "Educação Física",
  "Musicoterapia",
  "Nutrição",
  "Pedagogia",
  "Terapia Ocupacional",
  "Serviço Social",
  "Enfermagem",
  "Clínico Geral",
  "Generalista",
  "Fisiatra",
  "Neurologista",
  "Neuropediatra",
  "Ortopedista",
  "Otorrinolaringologista",
  "Oftalmologista",
  "Psiquiatra",
  "Pediatra",
  "Geral",
] as const;

/** Cor fallback para especialidades não mapeadas */
export const DEFAULT_SPECIALTY_COLOR = "#64748B";

/** Retorna a cor associada à especialidade (case-sensitive). */
export function getSpecialtyColor(specialty: string): string {
  if (!specialty) return DEFAULT_SPECIALTY_COLOR;
  return (
    SPECIALTY_COLORS[specialty] ??
    SPECIALTY_COLORS[specialty.trim()] ??
    DEFAULT_SPECIALTY_COLOR
  );
}
