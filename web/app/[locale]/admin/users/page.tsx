import { getUsersAction } from "@/features/admin/actions";
import { UsersPageClient } from "./users-page-client";

/**
 * =====================================================================
 * USERS PAGE (Server Component)
 * =====================================================================
 * Fetch users with server-side filtering (Role) and Counts.
 */

async function getUserCounts() {
  try {
    // Fetch counts for common roles
    const [all, admins, users] = await Promise.all([
      getUsersAction(1, 1),
      getUsersAction(1, 1, "", "ADMIN"),
      getUsersAction(1, 1, "", "USER"),
    ]);

    return {
      total: "data" in all ? all.meta?.total || 0 : 0,
      admin: "data" in admins ? admins.meta?.total || 0 : 0,
      user: "data" in users ? users.meta?.total || 0 : 0,
    };
  } catch (error) {
    // console.error("Error fetching user counts:", error);
    return { total: 0, admin: 0, user: 0 };
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;
  const search = (params?.search as string) || "";
  const role = (params?.role as string) || "all";

  const [response, counts] = await Promise.all([
    getUsersAction(page, limit, search, role),
    getUserCounts(),
  ]);

  if ("error" in response) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading users: {response.error}
      </div>
    );
  }

  return (
    <UsersPageClient
      initialUsers={response.data || []}
      total={response.meta?.total || 0}
      page={page}
      limit={limit}
      counts={counts}
      currentRole={role}
    />
  );
}
