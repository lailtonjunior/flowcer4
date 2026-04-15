/**
 * Escolhe cor de texto contrastante (branco ou navy) para um background hex.
 * Usa luminância relativa ITU-R BT.601.
 */
export function getContrastText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#FFFFFF";
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0B1F3A" : "#FFFFFF";
}
