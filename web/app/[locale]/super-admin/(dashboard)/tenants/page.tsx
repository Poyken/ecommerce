import { getTenantsAction } from "@/features/admin/actions";
import { TenantsClient } from "./tenants-client";


export default async function TenantsPage() {
  // Fetch tenants
  const tenantsRes = await getTenantsAction();

  if (tenantsRes.error) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">Error Loading Tenants</h2>
          <p>{tenantsRes.error}</p>
          </div>
      </div>
    );
  }

  const tenants = tenantsRes.data || [];
  const meta = tenantsRes.meta;

  return (
    <TenantsClient
      tenants={tenants}
      total={meta?.total || 0}
      page={meta?.page || 1}
      limit={meta?.limit || 10}
    />
  );
}
