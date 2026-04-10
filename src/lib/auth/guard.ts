import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AdminUser } from "@/types/database";

export async function requireAdmin(): Promise<{
  user: { id: string; email: string };
  admin: AdminUser;
}> {
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
    // Usuário autenticado mas não é admin: derruba sessão.
    await supabase.auth.signOut();
    redirect("/login?error=not_admin");
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    admin: admin as AdminUser,
  };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
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
}
