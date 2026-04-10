import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth/guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar adminName={admin.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px] px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
