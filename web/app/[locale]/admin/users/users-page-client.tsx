"use client";

/**
 * =====================================================================
 * USERS PAGE CLIENT - Quản lý người dùng (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Filter theo role (Server-side via URL)
 * - Stats fetched from server
 * - Pagination optimized
 * =====================================================================
 */

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { DataTablePagination } from "@/components/atoms/data-table-pagination";
import { Input } from "@/components/atoms/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/atoms/tabs";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/components/organisms/admin/admin-page-components";
import { CreateUserDialog } from "@/components/organisms/admin/create-user-dialog";
import { UserActions } from "@/components/organisms/user-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { User } from "@/types/models";
import { format } from "date-fns";
import {
  Mail,
  Plus,
  Search,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type FilterType = "all" | "ADMIN" | "USER";

export function UsersPageClient({
  initialUsers,
  total,
  page,
  limit,
  counts,
  currentRole = "all",
}: {
  initialUsers: User[];
  total: number;
  page: number;
  limit: number;
  counts?: { total: number; admin: number; user: number };
  currentRole?: string;
}) {
  const t = useTranslations("admin");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const { hasPermission } = useAuth();

  const canUpdate = hasPermission("user:update");
  const canDelete = hasPermission("user:delete");
  const canCreate = hasPermission("user:create");
  const canAssignRoles = hasPermission("user:update");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Server Stats
  const adminCount = counts?.admin || 0;
  const userCount = counts?.user || 0;
  const totalCount = counts?.total || total;

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`/admin/users?${params.toString()}`);
      });
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const handleRoleChange = (role: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (role === "all") {
        params.delete("role");
      } else {
        params.set("role", role);
      }
      params.set("page", "1");
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  // Helper to check admin role for UI display
  const isAdmin = (user: User) => {
    if (!Array.isArray(user.roles)) return false;
    return user.roles.some((role) => {
      const roleName = typeof role === "string" ? role : role.role?.name;
      return roleName?.toLowerCase().includes("admin");
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={t("users.management")}
        subtitle={t("users.showingCount", {
          count: initialUsers.length,
          total: totalCount,
        })}
        icon={<Users className="h-5 w-5" />}
        stats={[
          { label: "total", value: totalCount, variant: "default" },
          { label: "admins", value: adminCount, variant: "info" },
          { label: "users", value: userCount, variant: "success" },
        ]}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("users.createNew")}
            </Button>
          ) : undefined
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Tabs
          value={currentRole === "all" ? "all" : currentRole}
          onValueChange={handleRoleChange}
        >
          <TabsList>
            <TabsTrigger value="all" className="gap-2" disabled={isPending}>
              <Users className="h-4 w-4" />
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="ADMIN" className="gap-2" disabled={isPending}>
              <Shield className="h-4 w-4" />
              Admins ({adminCount})
            </TabsTrigger>
            <TabsTrigger value="USER" className="gap-2" disabled={isPending}>
              <UserIcon className="h-4 w-4" />
              Users ({userCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("users.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("users.emailLabel")}
                </div>
              </TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("sidebar.roles")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              {(canUpdate || canDelete || canAssignRoles) && (
                <TableHead className="text-right w-[100px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canUpdate || canDelete || canAssignRoles ? 5 : 4}
                >
                  <AdminEmptyState
                    icon={Users}
                    title={t("noFound", { item: t("users.title") })}
                    description="No users found matching your criteria."
                    action={
                      canCreate ? (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create User
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              initialUsers.map((user: User) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                          isAdmin(user)
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(user.roles) && user.roles.length > 0 ? (
                        user.roles.map((role) => {
                          const roleName =
                            typeof role === "string" ? role : role.role?.name;
                          const isAdminRole = roleName
                            ?.toLowerCase()
                            .includes("admin");
                          return (
                            <Badge
                              key={roleName}
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                isAdminRole
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : "bg-primary/10 text-primary border-primary/20"
                              )}
                            >
                              {isAdminRole && (
                                <Shield className="h-3 w-3 mr-1" />
                              )}
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
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  {(canUpdate || canDelete || canAssignRoles) && (
                    <TableCell className="text-right">
                      <UserActions user={user} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Pagination with page numbers - only show when needed */}
      {initialUsers.length > 0 && total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
