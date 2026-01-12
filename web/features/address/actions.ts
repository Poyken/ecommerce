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
 * - Khi checkout, hệ thống ưu tiên dùng địa chỉ mặc định *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { ActionResult } from "@/types/api";

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
 */
function revalidateAddressPaths() {
  REVALIDATE.cart();
  REVALIDATE.profile();
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
export async function createAddressAction(
  formData: FormData
): Promise<ActionResult<void>> {
  const data = extractAddressData(formData);

  if (!validateRequiredFields(data)) {
    return {
      success: false,
      error: "Vui lòng điền đầy đủ các trường bắt buộc",
    };
  }

  return wrapServerAction(async () => {
    await http("/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateAddressPaths();
  }, "Không thể tạo địa chỉ");
}

/**
 * Cập nhật địa chỉ đã tồn tại.
 *
 * @param id - ID của địa chỉ cần cập nhật
 * @param formData - Dữ liệu form mới
 * @returns { success: true } hoặc { error: "message" }
 */
export async function updateAddressAction(
  id: string,
  formData: FormData
): Promise<ActionResult<void>> {
  const data = extractAddressData(formData);

  if (!validateRequiredFields(data)) {
    return {
      success: false,
      error: "Vui lòng điền đầy đủ các trường bắt buộc",
    };
  }

  return wrapServerAction(async () => {
    await http(`/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidateAddressPaths();
  }, "Không thể cập nhật địa chỉ");
}

/**
 * Xóa địa chỉ.
 *
 * @param id - ID của địa chỉ cần xóa
 * @returns { success: true } hoặc { error: "message" }
 *
 * ⚠️ LƯU Ý: Nếu xóa địa chỉ mặc định, user cần set địa chỉ khác làm mặc định.
 */
export async function deleteAddressAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/addresses/${id}`, {
      method: "DELETE",
    });
    revalidateAddressPaths();
  }, "Không thể xóa địa chỉ");
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
export async function setDefaultAddressAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        isDefault: true,
      }),
    });
    revalidateAddressPaths();
  }, "Không thể đặt địa chỉ mặc định");
}
