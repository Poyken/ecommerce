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
 * - Pagination optimized *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Multi-role Community Monitoring: Giúp Admin theo dõi và phân loại nhanh chóng số lượng quản trị viên (Admins) và khách hàng (Users), cung cấp cái nhìn tổng quan về sự phát triển của cộng đồng người dùng trên Store.
 * - Scalable Access Auditing: Hỗ trợ kiểm soát và rà soát quyền truy cập của từng tài khoản, đảm bảo rằng việc phân bổ vai trò (Roles) luôn tuân thủ các quy tắc bảo mật của hệ thống.

 * =====================================================================
 */

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { CreateUserDialog } from "@/features/admin/components/users/create-user-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { UserActions } from "@/features/layout/components/user-actions";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { cn } from "@/lib/utils";
import { User } from "@/types/models";
import { format } from "date-fns";
import {
  Download,
  Mail,
  Plus,
  Search,
  Shield,
  Upload,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ImportDialog } from "@/components/shared/data-table/import-dialog";
import { ExportButton } from "@/components/shared/data-table/export-button";
import { useUsersImportExport } from "@/features/admin/hooks/use-users-import-export";

type FilterType = "all" | "ADMIN" | "USER";

export function UsersPageClient({
  initialUsers,
  total,
  page,
  limit,
  counts,
  currentRole = "all",
  basePath = "/admin/users",
}: {
  initialUsers: User[];
  total: number;
  page: number;
  limit: number;
  counts?: { total: number; admin: number; user: number };
  currentRole?: string;
  basePath?: string;
}) {
  const t = useTranslations("admin");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { searchTerm, setSearchTerm, isPending, handleFilterChange } =
    useAdminTable(basePath);

  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("user:update");
  const canDelete = hasPermission("user:delete");
  const canCreate = hasPermission("user:create");
  const canAssignRoles = hasPermission("user:update");

  const { importUsers, exportUsers, downloadTemplate, previewUsers } =
    useUsersImportExport();

  // Server Stats
  const adminCount = counts?.admin || 0;
  const userCount = counts?.user || 0;
  const totalCount = counts?.total || total;

  const handleRoleChange = (role: string) => {
    handleFilterChange("role", role);
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("users.management")}
        subtitle={t("users.showingCount", {
          count: initialUsers.length,
          total: totalCount,
        })}
        icon={<Users className="text-violet-600 fill-violet-600/10" />}
        variant="violet"
        stats={[
          { label: "Total", value: totalCount, variant: "slate" },
          { label: "Admins", value: adminCount, variant: "sky" },
          { label: "Users", value: userCount, variant: "emerald" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              {t("import")}
            </Button>
            <ImportDialog
              title={`${t("import")} ${t("users.title")}`}
              open={importDialogOpen}
              onOpenChange={setImportDialogOpen}
              onImport={importUsers}
              onPreview={previewUsers}
              onDownloadTemplate={downloadTemplate}
            />
            <ExportButton onExport={exportUsers} />
            {canCreate && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="rounded-xl shadow-lg shadow-primary/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("users.createNew")}
              </Button>
            )}
          </div>
        }
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={currentRole === "all" ? "all" : currentRole}
          onValueChange={handleRoleChange}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
              disabled={isPending}
            >
              <Users className="h-4 w-4" />
              All
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-black"
              >
                {totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="ADMIN"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all gap-2"
              disabled={isPending}
            >
              <Shield className="h-4 w-4" />
              Admins
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] font-black"
              >
                {adminCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="USER"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
              disabled={isPending}
            >
              <UserIcon className="h-4 w-4" />
              Users
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[10px] font-black"
              >
                {userCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full md:w-80">
          <AdminSearchInput
            placeholder={t("users.searchPlaceholder")}
            value={searchTerm}
            onChange={setSearchTerm}
            isLoading={isPending}
          />
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isPending} >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("users.emailLabel")}
                </div>
              </TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>{t("sidebar.roles")}</TableHead>
              <TableHead>Status</TableHead>
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
                  colSpan={canUpdate || canDelete || canAssignRoles ? 6 : 5}
                >
                  <AdminEmptyState
                    icon={Users}
                    title={t("noFound", { item: t("users.title") })}
                    description="No users found matching your criteria."
                    variant="minimal"
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
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
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
                  <TableCell>
                    <Badge
                      variant={
                        (user as any).deletedAt ? "destructive" : "default"
                      }
                      className={cn(
                        (user as any).deletedAt
                          ? "bg-red-100 text-red-600 hover:bg-red-100/80"
                          : "bg-green-100 text-green-600 hover:bg-green-100/80"
                      )}
                    >
                      {(user as any).deletedAt ? "Inactive" : "Active"}
                    </Badge>
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
