"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  MonitorPlay,
  Settings,
  UserRound,
  Users,
  Ban,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/profissionais", label: "Profissionais", icon: UserRound },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/bloqueios", label: "Bloqueios", icon: Ban },
  { href: "/admin/ao-vivo", label: "Tela Ao Vivo", icon: MonitorPlay },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-navy-500 text-sand-50">
      <div className="flex items-center gap-3 border-b border-navy-400/40 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-aqua-400 text-navy-700">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Agenda CER4</p>
          <p className="text-xs text-sand-200/80">Painel administrativo</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-aqua-400 text-navy-700 font-medium"
                  : "text-sand-100 hover:bg-navy-400/40"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-navy-400/40 p-4">
        <p className="mb-2 truncate text-xs text-sand-200/80">{adminName}</p>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md bg-navy-400/40 px-3 py-2 text-sm text-sand-100 hover:bg-navy-400/60"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
