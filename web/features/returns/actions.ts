"use server";

import { wrapServerAction, REVALIDATE } from "@/lib/safe-action";
import { ReturnRequest } from "@/types/models";
import { ReturnRequestSchema } from "@/lib/schemas";
import { cache } from "react";
import { cookies } from "next/headers";
import { z } from "zod";

import { returnService } from "./services/return.service";

// Type inferred from schema
type CreateReturnRequestInput = z.infer<typeof ReturnRequestSchema>;

/**
 * Fetch return requests for the current user.
 */
export const getMyReturnsAction = cache(async (page = 1, limit = 10) => {
  await cookies();
  return wrapServerAction(
    () => returnService.getMyReturns(page, limit),
    "Failed to fetch return requests"
  );
});

/**
 * Fetch a single return request by ID.
 */
export const getReturnRequestDetailAction = cache(async (id: string) => {
  await cookies();
  return wrapServerAction(
    () => returnService.getReturnRequestDetail(id),
    "Failed to fetch return request details"
  );
});

/**
 * Create a new return request.
 */
export async function createReturnRequestAction(
  data: CreateReturnRequestInput
) {
  await cookies();

  // Validate with Zod
  const parsed = ReturnRequestSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return wrapServerAction(async () => {
    const res = await returnService.createReturnRequest(parsed.data);
    REVALIDATE.orders();
    REVALIDATE.returns();
    return res;
  }, "Failed to create return request");
}

/**
 * Update tracking info for a return request.
 */
export async function updateReturnTrackingAction(
  id: string,
  trackingCode: string,
  carrier: string
) {
  await cookies();
  return wrapServerAction(async () => {
    const res = await returnService.updateReturnTracking(id, {
      trackingCode,
      carrier,
    });
    REVALIDATE.returns();
    return res;
  }, "Failed to update tracking information");
}
