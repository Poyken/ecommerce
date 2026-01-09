import { getPermissionsAction } from "@/features/admin/actions";
import { PermissionsPageClient } from "./permissions-page-client";

export default async function PermissionsPage() {
  const result = await getPermissionsAction();
  const permissions = result.success ? result.data || [] : [];

  return <PermissionsPageClient initialPermissions={permissions} />;
}
