/**
 * =====================================================================
 * USER REPOSITORY INTERFACE - Port for User Data Access
 * =====================================================================
 */

import {
  PaginatedResult,
  PaginationParams,
} from '@core/application/pagination';
import { User, UserRole, UserStatus } from '../entities/user.entity';

/**
 * User query options
 */
export interface UserQueryOptions extends PaginationParams {
  role?: UserRole | UserRole[];
  status?: UserStatus;
  search?: string; // email, name
  emailVerified?: boolean;
}

/**
 * User Repository Interface
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by ID or throw
   */
  findByIdOrFail(id: string): Promise<User>;

  /**
   * Find user by email within tenant
   */
  findByEmail(tenantId: string, email: string): Promise<User | null>;

  /**
   * Find user by email across all tenants (for super admin)
   */
  findByEmailGlobal(email: string): Promise<User | null>;

  /**
   * Check if user exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if email is unique within tenant
   */
  isEmailUnique(
    tenantId: string,
    email: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Find all users with filtering
   */
  findAll(
    tenantId: string,
    options?: UserQueryOptions,
  ): Promise<PaginatedResult<User>>;

  /**
   * Find staff users (admin + staff)
   */
  findStaff(tenantId: string): Promise<User[]>;

  /**
   * Count users by role
   */
  countByRole(tenantId: string): Promise<Record<UserRole, number>>;

  /**
   * Save user
   */
  save(user: User): Promise<User>;

  /**
   * Delete user (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Batch find by IDs
   */
  findByIds(ids: string[]): Promise<User[]>;

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId: string): Promise<void>;
}

/**
 * Symbol for dependency injection
 */
export const USER_REPOSITORY = Symbol('IUserRepository');
