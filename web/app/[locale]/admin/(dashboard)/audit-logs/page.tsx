import { getAuditLogsAction } from "@/features/admin/actions";
import { AuditLogsClient } from "./audit-logs-client";

/**
 * =====================================================================
 * ADMIN AUDIT LOGS PAGE - Nhật ký hệ thống (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 * - Trang này hiển thị tất cả các hoạt động nhạy cảm của hệ thống (Audit Logs).
 * - Giúp quản trị viên theo dõi "Ai đã làm gì, vào lúc nào và thay đổi ra sao".
 *
 * 2. KIỂM TRA QUYỀN TRUY CẬP (Role-Based Access Control):
 * - `getAuditLogsAction` sẽ kiểm tra quyền `audit:read` của user hiện tại.
 * - Nếu không có quyền, Server Action sẽ trả về object có thuộc tính `error: "Forbidden"`.
 *
 * 3. PHÂN TRANG & TÌM KIẾM:
 * - Dữ liệu nhật ký có thể rất lớn, do đó bắt buộc phải sử dụng phân trang (Pagination) ở server.
 * - Chỉ lấy 10-20 bản ghi mỗi lần gọi API để tối ưu tốc độ.
 * =====================================================================
 */

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = (params?.search as string) || "";
  const filter = (params?.filter as string) || "all";

  const response = await getAuditLogsAction({
    page,
    limit: 20,
    search,
    filter,
  });

  if ("error" in response) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="max-w-md w-full p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center space-y-2">
          <h3 className="font-semibold text-destructive text-lg">
            Access Denied
          </h3>
          <p className="text-sm text-muted-foreground">
            {response.error === "Forbidden"
              ? "You do not have permission to view audit logs."
              : response.error}
          </p>
        </div>
      </div>
    );
  }

  const logs = response.data || [];
  const total = response.meta?.total || 0;

  return (
    <AuditLogsClient
      logs={logs as any[]}
      total={total}
      page={page}
      limit={20}
    />
  );
}
