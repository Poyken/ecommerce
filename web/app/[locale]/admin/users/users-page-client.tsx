"use client";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { DataTableEmptyRow } from "@/components/atoms/data-table-empty-row";
import { DataTablePagination } from "@/components/atoms/data-table-pagination";
import { GlassCard } from "@/components/atoms/glass-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { AdminSearchInput } from "@/components/organisms/admin/admin-search-input";
import { CreateUserDialog } from "@/components/organisms/admin/create-user-dialog";
import { UserActions } from "@/components/organisms/user-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { User } from "@/types/models";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function UsersPageClient({
  users,
  total,
  page,
  limit,
}: {
  users: User[];
  total: number;
  page: number;
  limit: number;
}) {
  /**
   * =====================================================================
   * ADMIN USERS CLIENT - Quản lý người dùng
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. RBAC PERMISSION CHECK (`hasPermission`):
   * - Chỉ hiển thị nút "Create User" nếu user hiện tại có quyền `user:create`.
   * - Logic này được lấy từ `AuthProvider` (Client-side protection).
   *
   * 2. ROLE DISPLAY:
   * - User có thể có nhiều roles.
   * - Map qua mảng roles để render từng Badge tương ứng.
   * - Xử lý trường hợp role là string hoặc object (do cấu trúc API có thể khác nhau).
   * =====================================================================
   */
  const t = useTranslations("admin");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission("user:update");
  const canDelete = hasPermission("user:delete");
  const canAssignRoles = hasPermission("user:update"); // Assuming update permission is needed for assigning roles

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Update URL when debounced search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      if (debouncedSearchTerm) {
        params.set("search", debouncedSearchTerm);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/admin/users?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("users.management")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("users.showingCount", { count: users.length, total: total })}
          </p>
        </div>
        {hasPermission("user:create") && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            {t("users.createNew")}
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <AdminSearchInput
          placeholder={t("users.searchPlaceholder")}
          value={searchTerm}
          onChange={setSearchTerm}
          className="max-w-sm"
        />
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t("users.allLabel")}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("users.emailLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("name")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("sidebar.roles")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("created")}
              </TableHead>
              {(canUpdate || canDelete || canAssignRoles) && (
                <TableHead className="text-right text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user: User) => (
                <TableRow
                  key={user.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(user.roles) && user.roles.length > 0 ? (
                        user.roles.map((role) => {
                          const roleName =
                            typeof role === "string" ? role : role.role.name;
                          return (
                            <Badge
                              key={roleName}
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20"
                            >
                              {roleName}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">
                          {t("none")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  {(canUpdate || canDelete || canAssignRoles) && (
                    <TableCell className="text-right">
                      <UserActions user={user} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <DataTableEmptyRow
                colSpan={canUpdate || canDelete || canAssignRoles ? 5 : 4}
                message={t("noFound", { item: t("users.title") })}
              />
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {/* Pagination */}
        <DataTablePagination page={page} total={total} limit={limit} />
      </GlassCard>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
