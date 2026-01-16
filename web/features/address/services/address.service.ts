import { http } from "@/lib/http";

/**
 * =====================================================================
 * ADDRESS SERVICE - Domain logic for user addresses
 * =====================================================================
 */

export interface AddressData {
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

export const addressService = {
  /**
   * Create a new address
   */
  createAddress: async (data: AddressData) => {
    return http.post("/addresses", data);
  },

  /**
   * Update an existing address
   */
  updateAddress: async (id: string, data: Partial<AddressData>) => {
    return http.patch(`/addresses/${id}`, data);
  },

  /**
   * Delete an address
   */
  deleteAddress: async (id: string) => {
    return http.delete(`/addresses/${id}`);
  },

  /**
   * Set address as default
   */
  setDefaultAddress: async (id: string) => {
    return http.patch(`/addresses/${id}`, { isDefault: true });
  },
};
