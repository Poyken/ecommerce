import { getUsersAction } from "@/actions/admin";
import { UsersPageClient } from "./users-page-client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";

  const result = await getUsersAction(page, limit, search);

  if (result.error) {
    return (
      <div className="text-red-600">
        Error loading users: {result.error}
      </div>
    );
  }

  return (
    <UsersPageClient
      users={result.data || []}
      total={result.meta?.total || 0}
      page={page}
      limit={limit}
    />
  );
}
