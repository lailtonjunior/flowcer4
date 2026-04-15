import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AdminUser } from "@/types/database";

/**
 * Cacheado por request via React.cache(): se a mesma requisição chamar
 * `requireAdmin()` várias vezes (ex.: layout + 3 server actions na mesma
 * página), só haverá UMA chamada a `auth.getUser()` + UMA query em
 * `admin_users`. Os demais consumidores recebem o resultado memoizado.
 */
export const requireAdmin = cache(async (): Promise<{
  user: { id: string; email: string };
  admin: AdminUser;
}> => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/login?error=not_admin");
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    admin: admin as AdminUser,
  };
});

export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return (data as AdminUser) ?? null;
});
