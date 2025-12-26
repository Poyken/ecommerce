import { addToCartAction } from "@/actions/cart";
import { useToast } from "@/hooks/use-toast";
import { useCartContext } from "@/providers/cart-provider";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

/**
 * =====================================================================
 * USE CART HOOK - Hook xử lý hành động thêm vào giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID STRATEGY (Chiến lược lai):
 * - Ưu tiên 1: Gọi Server Action (`addToCartAction`) để lưu vào Database (nếu đã login).
 * - Ưu tiên 2: Nếu lỗi 401 (Chưa login), tự động fallback lưu vào `localStorage` (Guest Cart).
 * -> Tại sao? Để không làm gián đoạn trải nghiệm mua sắm. Khách có thể add cart trước, login sau.
 *
 * 2. OPTIMISTIC UPDATE (Cập nhật lạc quan):
 * - Ngay khi bấm nút, gọi `increment()` để Badge giỏ hàng nhảy số (+1) NGAY LẬP TỨC.
 * - Không chờ Server trả về (Latency). Tạo cảm giác app cực nhanh.
 *
 * 3. EVENT DISPATCH:
 * - Khi lưu vào LocalStorage, phải bắn event `guest_cart_updated` để `CartProvider` biết mà cập nhật lại state chung.
 * =====================================================================
 */

interface UseCartResult {
  addToCart: (skuId: string, quantity?: number) => Promise<boolean>;
  isAdding: boolean; // Trạng thái loading
}

export function useCart(productName?: string): UseCartResult {
  // State quản lý việc disable nút bấm khi đang xử lý
  const [isAdding, setIsAdding] = useState(false);

  // Hooks đa ngôn ngữ
  const t = useTranslations("productCard");
  const tToast = useTranslations("common.toast");

  // Hook hiển thị thông báo
  const { toast } = useToast();

  // Context giỏ hàng toàn cục (cung cấp hàm refresh và update badge)
  const { refreshCart, increment } = useCartContext();

  /**
   * Hàm chính: Thêm vào giỏ hàng
   * @param skuId - ID của biến thể sản phẩm (VD: Áo size M)
   * @param quantity - Số lượng (mặc định 1)
   */
  const addToCart = useCallback(
    async (skuId: string, quantity: number = 1): Promise<boolean> => {
      // Prevent double submission (debounce thủ công)
      if (isAdding) return false;

      setIsAdding(true);
      let addedSuccessfully = false;

      try {
        // BƯỚC 1: Thử gọi Server Action (Lưu vào Database)
        // -------------------------------------------------------------
        const result = await addToCartAction(skuId, quantity);

        if (result.success) {
          // THÀNH CÔNG (User đã login):
          // 1. Cập nhật số trên badge ngay lập tức (Optimistic UI)
          increment(quantity);

          // 2. Fetch lại dữ liệu giỏ hàng chuẩn từ server để đảm bảo đồng bộ
          await refreshCart();

          addedSuccessfully = true;
        } else if (result.error) {
          // THẤT BẠI (Có lỗi xảy ra):
          // Kiểm tra xem lỗi có phải do chưa đăng nhập (401) không?
          const errorLower = result.error.toLowerCase();
          const isAuthError =
            result.error.includes("401") ||
            errorLower.includes("unauthorized") ||
            errorLower.includes("login") ||
            errorLower.includes("authenticated");

          // Nếu lỗi KHÔNG PHẢI do chưa login (ví dụ: Hết hàng, Lỗi server)
          // -> Hiển thị thông báo lỗi và dừng lại.
          if (!isAuthError) {
            toast({
              title: tToast("error"),
              description: result.error,
              variant: "destructive",
            });
            return false;
          }
          // Nếu là lỗi chưa login -> Tiếp tục xuống Bước 2 (Fallback)
        }

        // BƯỚC 2: Fallback sang Guest Cart (LocalStorage)
        // -------------------------------------------------------------
        if (!addedSuccessfully) {
          console.log("Adding to guest cart (fallback)...");

          // Lấy giỏ hàng hiện tại từ LocalStorage (hoặc mảng rỗng nếu chưa có)
          const guestCart = JSON.parse(
            localStorage.getItem("guest_cart") || "[]"
          );

          // Kiểm tra xem sản phẩm đã có trong giỏ chưa
          const existingItemIndex = guestCart.findIndex(
            (item: { skuId: string; quantity: number }) => item.skuId === skuId
          );

          if (existingItemIndex > -1) {
            // Nếu có rồi -> Cộng dồn số lượng
            guestCart[existingItemIndex].quantity += quantity;
          } else {
            // Nếu chưa -> Thêm mới vào mảng
            guestCart.push({ skuId, quantity });
          }

          // Lưu ngược lại vào LocalStorage
          localStorage.setItem("guest_cart", JSON.stringify(guestCart));

          // Quan trọng: Bắn sự kiện để CartProvider biết có thay đổi
          window.dispatchEvent(new Event("guest_cart_updated"));

          // Cập nhật badge
          increment(quantity);
          addedSuccessfully = true;
        }

        // BƯỚC 3: Hiển thị thông báo thành công
        // -------------------------------------------------------------
        toast({
          variant: "success",
          title: t("addedToCart"),
          description: productName
            ? t("addedToCartDesc", { name: productName })
            : t("addedToCart"),
        });

        return true;
      } catch (e) {
        // Catch lỗi không mong muốn (Network error, Exception)
        console.error(e);
        toast({
          title: tToast("error"),
          description: t("errorGeneric"),
          variant: "destructive",
        });
        return false;
      } finally {
        // Luôn tắt trạng thái loading dù thành công hay thất bại
        setIsAdding(false);
      }
    },
    [isAdding, increment, refreshCart, toast, t, tToast, productName]
  );

  return { addToCart, isAdding };
}
