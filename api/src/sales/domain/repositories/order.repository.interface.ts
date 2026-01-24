/**
 * =====================================================================
 * ORDER REPOSITORY INTERFACE - Port for Order Data Access
 * =====================================================================
 */

import {
  PaginatedResult,
  PaginationParams,
} from '@core/application/pagination';
import { Order, OrderStatus } from '../entities/order.entity';

/**
 * Order query options
 */
export interface OrderQueryOptions extends PaginationParams {
  customerId?: string;
  status?: OrderStatus | OrderStatus[];
  fromDate?: Date;
  toDate?: Date;
  search?: string; // Order number, customer email
}

/**
 * Order Repository Interface
 */
export abstract class IOrderRepository {
  /**
   * Find order by ID
   */
  abstract findById(id: string): Promise<Order | null>;

  /**
   * Find order by ID or throw
   */
  abstract findByIdOrFail(id: string): Promise<Order>;

  /**
   * Find order by order number
   */
  abstract findByOrderNumber(
    tenantId: string,
    orderNumber: string,
  ): Promise<Order | null>;

  /**
   * Check if order exists
   */
  abstract exists(id: string): Promise<boolean>;

  /**
   * Find all orders with filtering
   */
  abstract findAll(
    tenantId: string,
    options?: OrderQueryOptions,
  ): Promise<PaginatedResult<Order>>;

  /**
   * Find orders by customer
   */
  abstract findByCustomer(
    customerId: string,
    options?: PaginationParams,
  ): Promise<PaginatedResult<Order>>;

  /**
   * Find recent orders
   */
  abstract findRecent(tenantId: string, limit?: number): Promise<Order[]>;

  /**
   * Count orders by status
   */
  abstract countByStatus(
    tenantId: string,
  ): Promise<Record<OrderStatus, number>>;

  /**
   * Generate next order number
   */
  abstract generateOrderNumber(tenantId: string): Promise<string>;

  /**
   * Save order
   */
  abstract save(order: Order): Promise<Order>;

  /**
   * Batch find by IDs
   */
  abstract findByIds(ids: string[]): Promise<Order[]>;

  /**
   * Get order statistics for dashboard
   */
  abstract getStatistics(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }>;
}

/**
 * Symbol for dependency injection
 */
export const ORDER_REPOSITORY = Symbol('IOrderRepository');
