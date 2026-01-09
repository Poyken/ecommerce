import { ActionResult, ApiResponse } from "@/types/dtos";

/**
 * Helper to wrap server action logic with try-catch and standard return format.
 * Supports standard API responses and paginated data.
 */
export async function wrapServerAction<T>(
  action: () => Promise<T | ApiResponse<T>>,
  errorMessage: string = "An unexpected error occurred"
): Promise<ActionResult<T>> {
  try {
    const result = await action();

    if (result && typeof result === "object" && "data" in result) {
      const apiRes = result as ApiResponse<T>;
      return {
        success: true,
        data: apiRes.data,
        meta: apiRes.meta,
      };
    }

    return { success: true, data: result as T };
  } catch (error: unknown) {
    console.error(`[Server Action Error] ${errorMessage}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : errorMessage,
    };
  }
}
