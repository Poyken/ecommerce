/**
 * =====================================================================
 * CART REPOSITORY INTERFACE - Port for Cart Data Access
 * =====================================================================
 */

import { Cart } from '../entities/cart.entity';

/**
 * Cart Repository Interface
 */
export abstract class ICartRepository {
  /**
   * Find cart by ID
   */
  abstract findById(id: string): Promise<Cart | null>;

  /**
   * Find cart by customer ID
   */
  abstract findByCustomer(customerId: string): Promise<Cart | null>;

  /**
   * Find cart by session ID (guest cart)
   */
  abstract findBySession(sessionId: string): Promise<Cart | null>;

  /**
   * Find or create cart for customer
   */
  abstract findOrCreateForCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<Cart>;

  /**
   * Find or create cart for session
   */
  abstract findOrCreateForSession(
    tenantId: string,
    sessionId: string,
  ): Promise<Cart>;

  /**
   * Save cart
   */
  abstract save(cart: Cart): Promise<Cart>;

  /**
   * Delete cart
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Delete abandoned carts older than specified date
   */
  abstract deleteAbandonedBefore(date: Date): Promise<number>;

  /**
   * Transfer session cart to customer (after login)
   */
  abstract transferToCustomer(
    sessionId: string,
    customerId: string,
  ): Promise<Cart | null>;
}

/**
 * Symbol for dependency injection
 */
export const CART_REPOSITORY = Symbol('ICartRepository');
