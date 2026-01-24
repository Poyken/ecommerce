import { getRolesAction } from "@/features/admin/actions";
import { RolesPageClient } from "./roles-client";



export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const result = await getRolesAction({ page, limit, search });

  if ("error" in result) {
    return (
      <div className="text-red-600">Error loading roles: {result.error}</div>
    );
  }

  return <RolesPageClient roles={(result.data || []) as any} meta={result.meta} />;
}
