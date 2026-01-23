/**
 * =====================================================================
 * CART REPOSITORY INTERFACE - Port for Cart Data Access
 * =====================================================================
 */

import { Cart } from '../entities/cart.entity';

/**
 * Cart Repository Interface
 */
export interface ICartRepository {
  /**
   * Find cart by ID
   */
  findById(id: string): Promise<Cart | null>;

  /**
   * Find cart by customer ID
   */
  findByCustomer(customerId: string): Promise<Cart | null>;

  /**
   * Find cart by session ID (guest cart)
   */
  findBySession(sessionId: string): Promise<Cart | null>;

  /**
   * Find or create cart for customer
   */
  findOrCreateForCustomer(tenantId: string, customerId: string): Promise<Cart>;

  /**
   * Find or create cart for session
   */
  findOrCreateForSession(tenantId: string, sessionId: string): Promise<Cart>;

  /**
   * Save cart
   */
  save(cart: Cart): Promise<Cart>;

  /**
   * Delete cart
   */
  delete(id: string): Promise<void>;

  /**
   * Delete abandoned carts older than specified date
   */
  deleteAbandonedBefore(date: Date): Promise<number>;

  /**
   * Transfer session cart to customer (after login)
   */
  transferToCustomer(
    sessionId: string,
    customerId: string,
  ): Promise<Cart | null>;
}

/**
 * Symbol for dependency injection
 */
export const CART_REPOSITORY = Symbol('ICartRepository');
