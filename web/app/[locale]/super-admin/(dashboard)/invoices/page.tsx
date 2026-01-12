// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// SUPER ADMIN INVOICES PAGE - TRANG QUẢN LÝ HÓA ĐƠN NỀN TẢNG
// =================================================================================================
//
// Đây là Server Component chịu trách nhiệm hiển thị danh sách hóa đơn SaaS (Software-as-a-Service).
// Hóa đơn này là tiền phí mà các Tenants (Chủ shop) trả cho Platform, KHÔNG PHẢI hóa đơn bán hàng lẻ.
//
// CHỨC NĂNG CHÍNH:
// 1. Data Fetching: Gọi `getInvoicesAction` để lấy dữ liệu ngay trên server (SSR).
// 2. Error Handling: Cung cấp fallback data an toàn nếu API gặp sự cố, tránh crash trang.
// 3. SEO & Metadata: (Có thể mở rộng) Là nơi thích hợp để define metadata cho trang.
//
// LƯU Ý:
// - Dữ liệu được truyền xuống Client Component (`InvoicesClient`) để xử lý tương tác.
// - Page này nằm trong route group `(dashboard)` nên thừa hưởng layout chung của Admin.
// ================================================================================================= 
import { getInvoicesAction } from "@/features/super-admin/domain-actions/invoices-actions";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const { data: invoicesRes } = await getInvoicesAction({ page: 1, limit: 20 });

  // Default structure if API returns null/error
  const initialData = invoicesRes || {
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage billing and view payment history.
          </p>
        </div>
      </div>
      <InvoicesClient initialData={initialData} />
    </div>
  );
}
