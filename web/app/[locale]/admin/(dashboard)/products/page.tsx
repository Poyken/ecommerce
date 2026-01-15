import { getProductsAction } from "@/features/admin/actions";
import { getTranslations } from "next-intl/server";
import { ProductsClient } from "./products-client";

/**
 * =====================================================================
 * ADMIN PRODUCTS PAGE - Quản lý sản phẩm (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUẢN LÝ DANH MỤC SẢN PHẨM:
 * - Đây là trang quản lý cốt lõi của eCommerce. Cho phép xem danh sách, lọc và tìm kiếm sản phẩm.
 * - Mỗi sản phẩm ở đây là một "Product" tổng thể (tên, mô tả chung), chưa bao gồm các biến thể màu sắc/kích thước (SKUs).
 *
 * 2. TỐI ƯU HÓA DỮ LIỆU (Hybrid Data Management):
 * - Dữ liệu danh sách sản phẩm được fetch tại đây (Server Side) vì nó thay đổi theo trang và từ khóa tìm kiếm.
 * - Tuy nhiên, các dữ liệu bổ trợ như "Brands" và "Categories" (thường dùng ở nhiều nơi) đã được `AdminLayout` chuẩn bị sẵn để tối ưu bộ nhớ.
 *
 * 3. PAGINATION:
 * - Sử dụng URL search params để quản lý trang hiện tại. Điều này giúp Admin có thể copy URL và gửi cho người khác mà vẫn giữ đúng trang đang xem. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Catalog Management: Quản lý hàng nghìn sản phẩm một cách khoa học thông qua hệ thống lọc và tìm kiếm mạnh mẽ, giúp tối ưu hóa luồng làm việc của bộ phận Quản lý sản phẩm.
 * - Inventory Visibility: Giúp Admin theo dõi nhanh tình trạng bao phủ của sản phẩm (theo Category/Brand) để đưa ra các điều chỉnh về chiến lược bán hàng phù hợp.

 * =====================================================================
 */

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>;
}) {
  const t = await getTranslations("admin.products");
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";

  // Fetch products only - Brands and Categories are handled by AdminMetadataProvider in Layout
  const filter = params.filter;

  // Map filters to API params
  const apiParams: any = { page, limit, search };
  if (filter === "recent") {
    apiParams.sort = "newest"; 
    // If backend supported date filtering, we'd add startDate here
  } else if (filter === "no-category") {
    apiParams.categoryId = "null"; // Assuming backend handles string "null" or we need to fix service
  }

  const [productsRes] = await Promise.all([
    getProductsAction(apiParams),
  ]);

  if (!("data" in productsRes)) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">{t("errorLoading")}</h2>
          <p>{(productsRes as any).error}</p>
        </div>
      </div>
    );
  }

  return (
    <ProductsClient
      products={productsRes.data || []}
      total={productsRes.meta?.total || 0}
      page={page}
      limit={limit}
    />
  );
}
