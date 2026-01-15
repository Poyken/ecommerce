/**
 * RETURN REQUEST TYPES
 * Matches API DTOs in api/src/return-requests/dto
 */

export enum ReturnType {
  REFUND_ONLY = "REFUND_ONLY",
  RETURN_AND_REFUND = "RETURN_AND_REFUND",
  EXCHANGE = "EXCHANGE",
}

export enum ReturnMethod {
  AT_COUNTER = "AT_COUNTER",
  PICKUP = "PICKUP",
  SELF_SHIP = "SELF_SHIP",
}

export enum RefundMethod {
  ORIGINAL_PAYMENT = "ORIGINAL_PAYMENT",
  BANK_TRANSFER = "BANK_TRANSFER",
  WALLET = "WALLET",
}

export enum ReturnStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  WAITING_FOR_RETURN = "WAITING_FOR_RETURN",
  IN_TRANSIT = "IN_TRANSIT",
  RECEIVED = "RECEIVED",
  INSPECTING = "INSPECTING",
  REFUNDED = "REFUNDED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface ReturnItem {
  orderItemId: string;
  quantity: number;
}

export interface BankAccount {
  bankName: string;
  number: string;
  owner: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  description?: string;
  type: ReturnType;
  returnMethod: ReturnMethod;
  pickupAddress?: Record<string, any>;
  refundMethod: RefundMethod;
  bankAccount?: BankAccount;
  refundAmount?: number;
  images: string[];
  items: ReturnItem[];
  status: ReturnStatus;
  trackingCode?: string;
  carrier?: string;
  inspectionNotes?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  userId: string;
}

export interface CreateReturnRequestDto {
  orderId: string;
  reason: string;
  description?: string;
  type: ReturnType;
  returnMethod: ReturnMethod;
  pickupAddress?: Record<string, any>;
  refundMethod: RefundMethod;
  bankAccount?: BankAccount;
  refundAmount?: number;
  images: string[];
  items: ReturnItem[];
}

export interface UpdateReturnRequestDto {
  status?: ReturnStatus;
  inspectionNotes?: string;
  rejectedReason?: string;
  trackingCode?: string;
  carrier?: string;
  refundAmount?: number;
}

export interface ReturnRequestPopulated extends ReturnRequest {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  items: (ReturnItem & {
    orderItem?: {
      productName?: string;
      skuNameSnapshot?: string;
      imageUrl?: string;
      priceAtPurchase: number;
    };
  })[];
  order?: {
    id: string;
    totalAmount: number;
  };
}
