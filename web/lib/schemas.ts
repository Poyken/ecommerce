/**
 * =====================================================================
 * VALIDATION SCHEMAS - Định nghĩa cấu trúc dữ liệu và ràng buộc
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ZOD LIBRARY:
 * - Sử dụng thư viện Zod để định nghĩa schema và validate dữ liệu ở Runtime.
 * - Giúp đảm bảo dữ liệu từ Form hoặc API luôn đúng định dạng trước khi xử lý.
 *
 * 2. SHARED SCHEMAS:
 * - Các schema này được dùng chung cho cả Client (Form validation) và Server (Action validation).
 * - Giúp code DRY (Don't Repeat Yourself) và đồng nhất logic kiểm tra.
 *
 * 3. ERROR MESSAGES:
 * - Các thông báo lỗi được định nghĩa trực tiếp trong schema.
 * - Có thể kết hợp với `react-hook-form` để hiển thị lỗi lên UI một cách tự động. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Runtime Safety: Ngăn chặn lỗi "sập trang" do data từ API gửi về không đúng cấu trúc mong muốn.
 * - UI Sync: Tự động hiển thị lỗi validation ngay dưới ô input khi người dùng nhập sai format (vd: sai định dạng email).

 * =====================================================================
 */

import { z } from "zod";
import { PATTERNS, VALIDATION } from "./constants";

// =============================================================================
// VALIDATION PATTERNS
// =============================================================================

export const ValidationPatterns = {
  email: PATTERNS.EMAIL,
  phoneVN: PATTERNS.PHONE_VN,
  password: PATTERNS.STRONG_PASSWORD,
  slug: PATTERNS.SLUG,
  url: PATTERNS.URL,
} as const;

// =============================================================================
// BASE SCHEMAS
// =============================================================================

export const BaseSchema = {
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(
      VALIDATION.PASSWORD_MIN_LENGTH,
      `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
    ),
  strongPassword: z
    .string()
    .min(
      VALIDATION.PASSWORD_MIN_LENGTH,
      `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
    )
    .regex(
      ValidationPatterns.password,
      "Password must contain at least 1 uppercase, 1 lowercase and 1 number"
    ),
  phoneVN: z
    .string()
    .regex(ValidationPatterns.phoneVN, "Invalid Vietnamese phone number"),
  name: z
    .string()
    .min(
      VALIDATION.NAME_MIN_LENGTH,
      `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`
    )
    .max(
      VALIDATION.NAME_MAX_LENGTH,
      `Name must be at most ${VALIDATION.NAME_MAX_LENGTH} characters`
    ),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      ValidationPatterns.slug,
      "Slug only contains lowercase letters, numbers and hyphens"
    ),
  price: z.number().min(0, "Price cannot be negative"),
  rating: z.number().int().min(1).max(5),
  content: z
    .string()
    .min(
      VALIDATION.REVIEW_MIN_LENGTH,
      `Content must be at least ${VALIDATION.REVIEW_MIN_LENGTH} characters`
    ),
  uuid: z.string().uuid("Invalid ID format"),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
} as const;

// =============================================================================
// FEATURE SCHEMAS
// =============================================================================

export const CartItemSchema = z.object({
  skuId: z.string().min(1, "SKU ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const AddressSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required"),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]{3,15}$/, "Invalid phone number"),
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  ward: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const ProfileUpdateSchema = z
  .object({
    name: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.currentPassword && !data.newPassword) return false;
      if (!data.currentPassword && data.newPassword) return false;
      return true;
    },
    {
      message: "Both current and new password are required to change password",
      path: ["newPassword"],
    }
  );

export const ReviewSchema = z.object({
  productId: BaseSchema.uuid,
  skuId: z.string().optional(),
  rating: BaseSchema.rating,
  content: BaseSchema.content,
  images: z.array(z.string()).optional(),
});

export const UpdateReviewSchema = z.object({
  rating: BaseSchema.rating,
  content: BaseSchema.content,
  images: z.array(z.string()).optional(),
});

export const CheckoutSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  phoneNumber: z.string().min(3, "Phone number is invalid"),
  shippingAddress: z.string().min(5, "Address is too short"),
  paymentMethod: z.enum(["COD", "CARD", "BANKING", "VNPAY", "MOMO", "VIETQR"]),
  itemIds: z.array(z.string()).optional(),
  couponCode: z.string().optional(),
  returnUrl: z.string().url().optional(),
  addressId: z.string().optional(),
});

export const LoginSchema = z.object({
  email: BaseSchema.email,
  password: BaseSchema.password,
});

export const RegisterSchema = z.object({
  firstName: BaseSchema.name,
  lastName: BaseSchema.name,
  email: BaseSchema.email,
  password: BaseSchema.password,
});

export const ForgotPasswordSchema = z.object({
  email: BaseSchema.email,
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: BaseSchema.password,
    confirmPassword: BaseSchema.password,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Compatibility aliases (lowercase)
export const loginSchema = LoginSchema;
export const registerSchema = RegisterSchema;
export const forgotPasswordSchema = ForgotPasswordSchema;
export const resetPasswordSchema = ResetPasswordSchema;
