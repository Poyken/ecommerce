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
export interface IOrderRepository {
  /**
   * Find order by ID
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Find order by ID or throw
   */
  findByIdOrFail(id: string): Promise<Order>;

  /**
   * Find order by order number
   */
  findByOrderNumber(
    tenantId: string,
    orderNumber: string,
  ): Promise<Order | null>;

  /**
   * Check if order exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find all orders with filtering
   */
  findAll(
    tenantId: string,
    options?: OrderQueryOptions,
  ): Promise<PaginatedResult<Order>>;

  /**
   * Find orders by customer
   */
  findByCustomer(
    customerId: string,
    options?: PaginationParams,
  ): Promise<PaginatedResult<Order>>;

  /**
   * Find recent orders
   */
  findRecent(tenantId: string, limit?: number): Promise<Order[]>;

  /**
   * Count orders by status
   */
  countByStatus(tenantId: string): Promise<Record<OrderStatus, number>>;

  /**
   * Generate next order number
   */
  generateOrderNumber(tenantId: string): Promise<string>;

  /**
   * Save order
   */
  save(order: Order): Promise<Order>;

  /**
   * Batch find by IDs
   */
  findByIds(ids: string[]): Promise<Order[]>;

  /**
   * Get order statistics for dashboard
   */
  getStatistics(
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
