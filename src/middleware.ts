import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Roda APENAS nas rotas que precisam de auth Supabase:
 *   - /admin e tudo dentro de /admin
 *   - /login (para já redirecionar quem está logado)
 *
 * Tudo mais (assets, /, manifest, sitemap, fetches RSC para rotas públicas,
 * Server Action de assets, etc.) escapa do auth check — economiza 1
 * round-trip Supabase em cada request irrelevante.
 */
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
