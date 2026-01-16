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
 * - Frictionless Checkout: Giúp khách hàng hoàn tất việc mua hàng nhanh hơn bằng cách tự động áp dụng địa chỉ mặc định đã lưu, giảm bớt công đoạn nhập liệu thủ công.
 * - Logistics Accuracy: Đảm bảo dữ liệu nhận hàng luôn chính xác và đầy đủ qua hệ thống quản lý địa chỉ có chiều sâu (Tỉnh -> Huyện -> Xã).

 * =====================================================================
 */

"use server";

import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { ActionResult } from "@/types/api";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

import { addressService } from "./services/address.service";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

/**
 * Re-export AddressData interface from service for consistency
 */
type AddressFormData = import("./services/address.service").AddressData;

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
    await addressService.createAddress(data);
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
    await addressService.updateAddress(id, data);
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
    await addressService.deleteAddress(id);
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
    await addressService.setDefaultAddress(id);
    revalidateAddressPaths();
  }, "Không thể đặt địa chỉ mặc định");
}
