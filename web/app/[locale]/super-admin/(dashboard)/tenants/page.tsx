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

  // Handle PaginatedData response
  // Assuming getTenantsAction returns { data: PaginatedData<Tenant> } or similar based on my implementation
  // create-tenant-dialog.tsx implementation of getTenantsAction return:
  /*
    return {
        data: res, // Tenant[]
        meta: { ... }
    };
  */
  // So tenantsRes.data is { data: Tenant[], meta: ... } ?
  // No, ActionResult<T> has .data: T.
  // getTenantsAction returns ActionResult<PaginatedData<Tenant>>.
  // So tenantsRes.data IS PaginatedData<Tenant>.
  // PaginatedData has .data (Tenant[]) and .meta.

  const paginatedData = tenantsRes.data;
  
  // Safety check
  if (!paginatedData || !Array.isArray(paginatedData.data)) {
      return <div>Invalid data format</div>
  }

  return (
    <TenantsClient
      tenants={paginatedData.data}
      total={paginatedData.meta.total}
      page={paginatedData.meta.page}
      limit={paginatedData.meta.limit}
    />
  );
}
