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
import { getErrorMessage } from "./error-utils";
import { BaseSchema, ValidationPatterns } from "./schemas";

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
          const message = getErrorMessage(err);
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

// Exported from schemas.ts for convenience
export { ValidationPatterns, BaseSchema as CommonSchemas };

/**
 * Tạo schema cho confirm password.
 */
export function createConfirmPasswordSchema() {
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
