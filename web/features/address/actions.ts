/**
 * =====================================================================
 * ADDRESS SERVER ACTIONS - Quản lý địa chỉ giao hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các Server Actions cho chức năng quản lý địa chỉ.
 * User có thể:
 * - Thêm địa chỉ mới
 * - Sửa địa chỉ đã có
 * - Xóa địa chỉ
 * - Đặt địa chỉ mặc định
 *
 * QUY TẮC NGHIỆP VỤ:
 * - Mỗi user có thể có nhiều địa chỉ
 * - Chỉ 1 địa chỉ được đánh dấu mặc định (isDefault = true)
 * - Khi checkout, hệ thống ưu tiên dùng địa chỉ mặc định
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

/**
 * Dữ liệu địa chỉ được trích xuất từ FormData.
 * Tất cả fields là optional vì FormData.get() có thể trả về null.
 */
interface AddressFormData {
  recipientName?: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  district?: string;
  ward?: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
  districtId?: number;
  provinceId?: number;
  wardCode?: string;
}

// =============================================================================
// 🔧 HELPER FUNCTIONS - Hàm hỗ trợ
// =============================================================================

/**
 * Trích xuất dữ liệu địa chỉ từ FormData.
 * Tập trung logic parsing để tránh duplicate code.
 *
 * @param formData - FormData từ form
 * @returns Object chứa dữ liệu địa chỉ
 */
function extractAddressData(formData: FormData): AddressFormData {
  return {
    recipientName: formData.get("recipientName")?.toString(),
    phoneNumber: formData.get("phoneNumber")?.toString(),
    street: formData.get("street")?.toString(),
    city: formData.get("city")?.toString(),
    district: formData.get("district")?.toString(),
    ward: formData.get("ward")?.toString(),
    postalCode: formData.get("postalCode")?.toString(),
    country: formData.get("country")?.toString(),
    isDefault: formData.get("isDefault") === "on",
    districtId: formData.get("districtId")
      ? Number(formData.get("districtId"))
      : undefined,
    provinceId: formData.get("provinceId")
      ? Number(formData.get("provinceId"))
      : undefined,
    wardCode: formData.get("wardCode")?.toString(),
  };
}

/**
 * Validate các trường bắt buộc của địa chỉ.
 *
 * @param data - Dữ liệu địa chỉ
 * @returns true nếu hợp lệ, false nếu thiếu trường bắt buộc
 */
function validateRequiredFields(data: AddressFormData): boolean {
  return !!(
    data.recipientName &&
    data.phoneNumber &&
    data.street &&
    data.city &&
    data.district &&
    data.districtId &&
    data.wardCode
  );
}

/**
 * Revalidate các paths liên quan đến địa chỉ.
 * Đảm bảo cache được làm mới sau khi thay đổi.
 */
function revalidateAddressPaths() {
  revalidatePath("/cart"); // Cart page có thể hiển thị địa chỉ giao hàng
  revalidatePath("/profile"); // Profile page hiển thị danh sách địa chỉ
}

// =============================================================================
// 📝 SERVER ACTIONS - Các hành động xử lý địa chỉ
// =============================================================================

/**
 * Tạo địa chỉ mới cho user.
 *
 * @param formData - Dữ liệu form chứa thông tin địa chỉ
 * @returns { success: true } hoặc { error: "message" }
 *
 * @example
 * // Trong component
 * const result = await createAddressAction(formData);
 * if (result.success) {
 *   toast.success("Đã thêm địa chỉ mới!");
 * }
 */
export async function createAddressAction(formData: FormData) {
  const data = extractAddressData(formData);

  // Validate các trường bắt buộc
  if (!validateRequiredFields(data)) {
    return { error: "Vui lòng điền đầy đủ các trường bắt buộc" };
  }

  try {
    await http("/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateAddressPaths();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể tạo địa chỉ";
    return { error: message };
  }
}

/**
 * Cập nhật địa chỉ đã tồn tại.
 *
 * @param id - ID của địa chỉ cần cập nhật
 * @param formData - Dữ liệu form mới
 * @returns { success: true } hoặc { error: "message" }
 */
export async function updateAddressAction(id: string, formData: FormData) {
  const data = extractAddressData(formData);

  // Validate các trường bắt buộc
  if (!validateRequiredFields(data)) {
    return { error: "Vui lòng điền đầy đủ các trường bắt buộc" };
  }

  try {
    await http(`/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidateAddressPaths();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể cập nhật địa chỉ";
    return { error: message };
  }
}

/**
 * Xóa địa chỉ.
 *
 * @param id - ID của địa chỉ cần xóa
 * @returns { success: true } hoặc { error: "message" }
 *
 * ⚠️ LƯU Ý: Nếu xóa địa chỉ mặc định, user cần set địa chỉ khác làm mặc định.
 */
export async function deleteAddressAction(id: string) {
  try {
    await http(`/addresses/${id}`, {
      method: "DELETE",
    });
    revalidateAddressPaths();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể xóa địa chỉ";
    return { error: message };
  }
}

/**
 * Đặt địa chỉ làm mặc định.
 * Backend sẽ tự động bỏ flag mặc định khỏi địa chỉ cũ.
 *
 * @param id - ID của địa chỉ muốn đặt mặc định
 * @returns { success: true } hoặc { error: "message" }
 *
 * @example
 * // Khi user click "Đặt làm mặc định"
 * await setDefaultAddressAction(addressId);
 */
export async function setDefaultAddressAction(id: string) {
  try {
    // API hỗ trợ PATCH với partial data
    // Chỉ gửi isDefault: true, backend xử lý logic còn lại
    await http(`/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        isDefault: true,
      }),
    });
    revalidateAddressPaths();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể đặt địa chỉ mặc định";
    return { error: message };
  }
}
