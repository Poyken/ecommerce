import { getRolesAction } from "@/actions/admin";
import { RolesPageClient } from "./roles-client";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const { data: roles, error } = await getRolesAction(1, 100, search);

  if (error) {
    return (
      <div className="text-red-600">
        Error loading roles: {error}
      </div>
    );
  }

  return <RolesPageClient roles={roles || []} />;
}
