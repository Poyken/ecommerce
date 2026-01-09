"use client";

/**
 * =====================================================================
 * FORM HELPERS - React Hook Form Utilities
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FORM PATTERNS:
 * - Các forms trong app thường có patterns giống nhau: submit, loading, error handling.
 * - File này cung cấp các utilities để giảm boilerplate.
 *
 * 2. ZOD INTEGRATION:
 * - Tích hợp sẵn với Zod cho validation.
 * - Type-safe forms với TypeScript.
 * =====================================================================
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import {
  FieldValues,
  UseFormProps,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { z } from "zod";

// =============================================================================
// TYPES
// =============================================================================

export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

export interface UseFormWithStateReturn<T extends FieldValues>
  extends UseFormReturn<T> {
  formState: UseFormReturn<T>["formState"] & FormState;
  submitWithState: (
    onSubmit: (data: T) => Promise<void>
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  resetFormState: () => void;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * useForm wrapper với additional state management cho submit.
 * Tự động handle loading, success, error states.
 *
 * @example
 * const form = useFormWithState({
 *   schema: LoginSchema,
 *   defaultValues: { email: "", password: "" },
 * });
 *
 * const onSubmit = async (data) => {
 *   await loginAction(data);
 * };
 *
 * return (
 *   <form onSubmit={form.submitWithState(onSubmit)}>
 *     {form.formState.error && <Alert>{form.formState.error}</Alert>}
 *     ...
 *   </form>
 * );
 */
export function useFormWithState<T extends FieldValues>(
  options: UseFormProps<T> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema?: z.ZodType<any>;
  }
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<T>({
    ...options,
    resolver: options.schema
      ? zodResolver(options.schema as any)
      : options.resolver,
  });

  const resetFormState = useCallback(() => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  const submitWithState = useCallback(
    (onSubmit: (data: T) => Promise<void>) => {
      return form.handleSubmit(async (data: T) => {
        setIsSubmitting(true);
        setError(null);
        setIsSuccess(false);

        try {
          await onSubmit(data);
          setIsSuccess(true);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Đã có lỗi xảy ra";
          setError(message);
        } finally {
          setIsSubmitting(false);
        }
      });
    },
    [form]
  );

  return {
    ...form,
    formState: {
      ...form.formState,
      isSubmitting,
      isSuccess,
      error,
    },
    submitWithState,
    resetFormState,
  };
}

// =============================================================================
// FORM FIELD HELPERS
// =============================================================================

/**
 * Helper để tạo error message cho form field.
 */
export function getFieldError(
  fieldState: { error?: { message?: string } },
  fallback = "Trường này không hợp lệ"
): string | undefined {
  return fieldState.error?.message || (fieldState.error ? fallback : undefined);
}

/**
 * Helper để kiểm tra form có dirty không (đã thay đổi so với giá trị ban đầu).
 */
export function hasFormChanges<T extends FieldValues>(
  form: UseFormReturn<T>
): boolean {
  return Object.keys(form.formState.dirtyFields).length > 0;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Các regex patterns phổ biến cho validation.
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneVN: /^(0[3|5|7|8|9])+([0-9]{8})$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
} as const;

/**
 * Các Zod schemas phổ biến có thể tái sử dụng.
 */
export const CommonSchemas = {
  /** Email chuẩn */
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),

  /** Password với yêu cầu độ mạnh */
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(100, "Mật khẩu tối đa 100 ký tự"),

  /** Password mạnh (có chữ hoa, thường, số) */
  strongPassword: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(
      ValidationPatterns.password,
      "Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
    ),

  /** Số điện thoại VN */
  phoneVN: z
    .string()
    .regex(ValidationPatterns.phoneVN, "Số điện thoại không hợp lệ"),

  /** Số điện thoại optional */
  phoneVNOptional: z
    .string()
    .regex(ValidationPatterns.phoneVN, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),

  /** Name field */
  name: z
    .string()
    .min(2, "Tên tối thiểu 2 ký tự")
    .max(50, "Tên tối đa 50 ký tự"),

  /** Slug field */
  slug: z
    .string()
    .min(1, "Slug là bắt buộc")
    .regex(
      ValidationPatterns.slug,
      "Slug chỉ chứa chữ thường, số và dấu gạch ngang"
    ),

  /** Price field */
  price: z.number().min(0, "Giá không được âm"),

  /** Quantity field */
  quantity: z
    .number()
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng tối thiểu là 1")
    .max(99, "Số lượng tối đa là 99"),

  /** Rating field */
  rating: z
    .number()
    .int()
    .min(1, "Rating tối thiểu 1 sao")
    .max(5, "Rating tối đa 5 sao"),

  /** Text content (review, comment) */
  content: z
    .string()
    .min(10, "Nội dung tối thiểu 10 ký tự")
    .max(1000, "Nội dung tối đa 1000 ký tự"),

  /** UUID */
  uuid: z.string().uuid("ID không hợp lệ"),

  /** URL */
  url: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
} as const;

/**
 * Tạo schema cho confirm password.
 */
export function createConfirmPasswordSchema(passwordField = "password") {
  return z
    .string()
    .min(1, "Xác nhận mật khẩu là bắt buộc")
    .refine((val) => val.length > 0, "Vui lòng xác nhận mật khẩu");
}

/**
 * Helper để thêm confirm password validation vào schema.
 */
export function withConfirmPassword<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  passwordField = "password",
  confirmField = "confirmPassword"
) {
  return schema.refine(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => data[passwordField] === data[confirmField],
    {
      message: "Mật khẩu xác nhận không khớp",
      path: [confirmField],
    }
  );
}
