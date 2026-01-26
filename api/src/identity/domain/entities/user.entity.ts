/**
 * =====================================================================
 * USER ENTITY - Domain Layer (Aggregate Root)
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * User is an Aggregate Root that represents a system user.
 * It handles authentication, authorization, and profile management.
 *
 * Business Rules:
 * 1. Email must be unique within tenant
 * 2. Password must meet complexity requirements
 * 3. User can have multiple roles
 * 4. Soft delete preserves order history
 */

import {
  AggregateRoot,
  BaseDomainEvent,
  EntityProps,
} from '@core/domain/entities/base.entity';
import { Email } from '@core/domain/value-objects/email.vo';
import { BusinessRuleViolationError } from '@core/domain/errors/domain.error';

// =====================================================================
// ENUMS
// =====================================================================

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

// =====================================================================
// DOMAIN EVENTS
// =====================================================================

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    readonly userId: string,
    readonly email: string,
    readonly role: UserRole,
  ) {
    super('UserCreated', userId);
  }
}

export class UserEmailVerifiedEvent extends BaseDomainEvent {
  constructor(readonly userId: string) {
    super('UserEmailVerified', userId);
  }
}

export class UserPasswordChangedEvent extends BaseDomainEvent {
  constructor(readonly userId: string) {
    super('UserPasswordChanged', userId);
  }
}

export class UserSuspendedEvent extends BaseDomainEvent {
  constructor(
    readonly userId: string,
    readonly reason: string,
  ) {
    super('UserSuspended', userId);
  }
}

export class UserRoleChangedEvent extends BaseDomainEvent {
  constructor(
    readonly userId: string,
    readonly oldRole: UserRole,
    readonly newRole: UserRole,
  ) {
    super('UserRoleChanged', userId);
  }
}

// =====================================================================
// VALUE OBJECTS (User-specific)
// =====================================================================

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// =====================================================================
// ENTITY PROPS
// =====================================================================

export interface UserProps extends EntityProps {
  tenantId: string;
  email: Email;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;

  // Profile
  profile: UserProfile;
  preferences: UserPreferences;

  // Security
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;

  // Permissions (for staff/admin)
  permissions: string[];

  // Soft delete
  deletedAt?: Date;

  // Social Login
  provider?: string;
  socialId?: string;
}

// =====================================================================
// AGGREGATE ROOT
// =====================================================================

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  // =====================================================================
  // FACTORY METHODS
  // =====================================================================

  /**
   * Create a new User (customer registration)
   */
  static createCustomer(props: {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    profile?: Partial<UserProfile>;
    provider?: string;
    socialId?: string;
  }): User {
    const user = new User({
      id: props.id,
      tenantId: props.tenantId,
      email: Email.create(props.email),
      passwordHash: props.passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.PENDING_VERIFICATION,
      profile: {
        firstName: props.profile?.firstName,
        lastName: props.profile?.lastName,
        phone: props.profile?.phone,
      },
      preferences: {
        language: 'vi',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      emailVerified: false,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: props.provider,
      socialId: props.socialId,
    });

    user.addDomainEvent(
      new UserCreatedEvent(user.id, props.email, UserRole.CUSTOMER),
    );

    return user;
  }

  /**
   * Create admin/staff user
   */
  static createStaff(props: {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    role: UserRole.ADMIN | UserRole.STAFF;
    permissions: string[];
    profile?: Partial<UserProfile>;
  }): User {
    const user = new User({
      id: props.id,
      tenantId: props.tenantId,
      email: Email.create(props.email),
      passwordHash: props.passwordHash,
      role: props.role,
      status: UserStatus.ACTIVE,
      profile: {
        firstName: props.profile?.firstName,
        lastName: props.profile?.lastName,
        phone: props.profile?.phone,
      },
      preferences: {
        language: 'vi',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      emailVerified: true, // Staff emails are pre-verified
      emailVerifiedAt: new Date(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
      permissions: props.permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    user.addDomainEvent(new UserCreatedEvent(user.id, props.email, props.role));

    return user;
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // =====================================================================
  // GETTERS
  // =====================================================================

  get tenantId(): string {
    return this.props.tenantId;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get provider(): string | undefined {
    return this.props.provider;
  }

  get socialId(): string | undefined {
    return this.props.socialId;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get profile(): UserProfile {
    return { ...this.props.profile };
  }

  get preferences(): UserPreferences {
    return { ...this.props.preferences };
  }

  get fullName(): string {
    const { firstName, lastName } = this.props.profile;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || lastName || this.props.email.value;
  }

  get isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  get isVerified(): boolean {
    return this.props.emailVerified;
  }

  get isMfaEnabled(): boolean {
    return this.props.mfaEnabled;
  }

  get isLocked(): boolean {
    return !!this.props.lockedUntil && this.props.lockedUntil > new Date();
  }

  get isAdmin(): boolean {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(this.props.role);
  }

  get isStaff(): boolean {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF].includes(
      this.props.role,
    );
  }

  get permissions(): readonly string[] {
    return Object.freeze([...this.props.permissions]);
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get mfaSecret(): string | undefined {
    return this.props.mfaSecret;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Verify email
   */
  verifyEmail(): void {
    if (this.props.emailVerified) {
      return; // Already verified
    }

    this.props.emailVerified = true;
    this.props.emailVerifiedAt = new Date();

    if (this.props.status === UserStatus.PENDING_VERIFICATION) {
      this.props.status = UserStatus.ACTIVE;
    }

    this.touch();
    this.addDomainEvent(new UserEmailVerifiedEvent(this.id));
  }

  /**
   * Change password
   */
  changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.resetLoginAttempts();
    this.touch();
    this.addDomainEvent(new UserPasswordChangedEvent(this.id));
  }

  /**
   * Update profile information
   */
  updateProfile(profile: Partial<UserProfile>): void {
    this.props.profile = {
      ...this.props.profile,
      ...profile,
    };
    this.touch();
  }

  /**
   * Link social account
   */
  linkSocialAccount(provider: string, socialId: string): void {
    this.props.provider = provider;
    this.props.socialId = socialId;
    this.touch();
  }

  /**
   * Update preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.props.preferences = {
      ...this.props.preferences,
      ...preferences,
    };
    this.touch();
  }

  /**
   * Record successful login
   */
  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.resetLoginAttempts();
    this.touch();
  }

  /**
   * Record failed login attempt
   */
  recordFailedLogin(): void {
    this.props.failedLoginAttempts += 1;

    // Lock after 5 failed attempts for 15 minutes
    if (this.props.failedLoginAttempts >= 5) {
      this.props.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    this.touch();
  }

  /**
   * Reset login attempts
   */
  resetLoginAttempts(): void {
    this.props.failedLoginAttempts = 0;
    this.props.lockedUntil = undefined;
  }

  /**
   * Enable MFA
   */
  enableMfa(secret: string): void {
    this.props.mfaEnabled = true;
    this.props.mfaSecret = secret;
    this.touch();
  }

  /**
   * Disable MFA
   */
  disableMfa(): void {
    this.props.mfaEnabled = false;
    this.props.mfaSecret = undefined;
    this.touch();
  }

  /**
   * Change user role
   */
  changeRole(newRole: UserRole): void {
    if (this.props.role === newRole) return;

    const oldRole = this.props.role;
    this.props.role = newRole;
    this.touch();
    this.addDomainEvent(new UserRoleChangedEvent(this.id, oldRole, newRole));
  }

  /**
   * Update permissions
   */
  setPermissions(permissions: string[]): void {
    this.props.permissions = [...permissions];
    this.touch();
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    if (this.props.role === UserRole.SUPER_ADMIN) {
      return true; // Super admin has all permissions
    }
    return this.props.permissions.includes(permission);
  }

  /**
   * Activate user
   */
  activate(): void {
    if (this.props.status === UserStatus.ACTIVE) return;

    this.props.status = UserStatus.ACTIVE;
    this.resetLoginAttempts();
    this.touch();
  }

  /**
   * Suspend user
   */
  suspend(reason: string): void {
    if (!this.isActive) {
      throw new BusinessRuleViolationError(
        'Cannot suspend inactive user',
        `User status is ${this.props.status}`,
      );
    }

    this.props.status = UserStatus.SUSPENDED;
    this.touch();
    this.addDomainEvent(new UserSuspendedEvent(this.id, reason));
  }

  /**
   * Soft delete user
   */
  delete(): void {
    if (this.props.deletedAt) return;

    this.props.deletedAt = new Date();
    this.props.status = UserStatus.INACTIVE;
    this.touch();
  }

  /**
   * Restore soft-deleted user
   */
  restore(): void {
    if (!this.props.deletedAt) return;

    this.props.deletedAt = undefined;
    this.props.status = UserStatus.ACTIVE;
    this.touch();
  }

  // =====================================================================
  // SERIALIZATION
  // =====================================================================

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      email: this.email.value,
      passwordHash: this.passwordHash,
      role: this.role,
      status: this.status,
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      phone: this.profile.phone,
      avatarUrl: this.profile.avatarUrl,
      emailVerified: this.isVerified,
      emailVerifiedAt: this.props.emailVerifiedAt,
      mfaEnabled: this.isMfaEnabled,
      lastLoginAt: this.lastLoginAt,
      failedLoginAttempts: this.props.failedLoginAttempts,
      lockedUntil: this.props.lockedUntil,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.props.deletedAt,
      provider: this.props.provider,
      socialId: this.props.socialId,
    };
  }
}
