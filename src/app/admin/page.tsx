import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOverview } from "@/components/admin/admin-overview";
import { AdminGuard } from "@/lib/auth/guards";

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AdminOverview />
      </AdminShell>
    </AdminGuard>
  );
}
