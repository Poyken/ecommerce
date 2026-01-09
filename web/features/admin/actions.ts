"use server";

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { Permission } from "@/types/models";
import { revalidatePath } from "next/cache";

export async function createPermissionAction(name: string) {
  try {
    const res = await http<ApiResponse<Permission>>("/permissions", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    revalidatePath("/admin/permissions");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create permission",
    };
  }
}

export async function updatePermissionAction(id: string, name: string) {
  try {
    const res = await http<ApiResponse<Permission>>(`/permissions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });

    revalidatePath("/admin/permissions");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update permission",
    };
  }
}

export async function deletePermissionAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/permissions/${id}`, {
      method: "DELETE",
    });

    revalidatePath("/admin/permissions");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete permission",
    };
  }
}
