import { getInvoicesAction } from "@/features/superadmin/domain-actions/invoices-actions";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const { data: invoicesRes } = await getInvoicesAction({ page: 1, limit: 20 });

  // Default structure if API returns null/error
  const initialData = invoicesRes || {
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage billing and view payment history.
          </p>
        </div>
      </div>
      <InvoicesClient initialData={initialData} />
    </div>
  );
}
