import { getRolesAction } from "@/features/admin/actions";
import { RolesPageClient } from "./roles-page-client";

export default async function RolesPage() {
  const result = await getRolesAction();
  const roles = result.success ? result.data || [] : [];
  return <RolesPageClient initialRoles={roles} />;
}
