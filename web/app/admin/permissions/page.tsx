import { getPermissionsAction } from "@/actions/admin";
import { PermissionsPageClient } from "./permissions-client";

export default async function PermissionsPage() {
  const { data: permissions, error } = await getPermissionsAction();

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">Error loading permissions</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return <PermissionsPageClient permissions={permissions || []} />;
}
