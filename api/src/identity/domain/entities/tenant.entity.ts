/**
 * =====================================================================
 * TENANT AGGREGATE - Domain Layer
 * =====================================================================
 */

import { AggregateRoot, EntityProps } from '@core/domain/entities/base.entity';
import { BusinessRuleViolationError } from '@core/domain/errors/domain.error';

export enum TenantPlan {
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface TenantProps extends EntityProps {
  name: string;
  ownerId?: string;
  subdomain?: string;
  customDomain?: string;
  domain: string;
  currency: string;
  timezone: string;
  locale: string;
  themeConfig?: any;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  plan: TenantPlan;
  isActive: boolean;
  suspendedAt?: Date;
  suspensionReason?: string;
  deletedAt?: Date;
  onboardingCompleted: boolean;
  onboardingStep: number;
  trialEndsAt?: Date;
  trialStartedAt?: Date;
  productLimit: number;
  storageLimit: number;
  staffLimit: number;
  currentProductCount: number;
  currentStorageUsed: number;
  currentStaffCount: number;
  businessType?: string;
  businessSize?: string;
  monthlyRevenue?: string;
  referralCode?: string;
  referredByCode?: string;
}

export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps) {
    super(props);
  }

  static create(props: {
    id: string;
    name: string;
    ownerId?: string;
    subdomain?: string;
    customDomain?: string;
    domain: string;
    currency?: string;
    timezone?: string;
    locale?: string;
    plan?: TenantPlan;
    isActive?: boolean;
    onboardingCompleted?: boolean;
    onboardingStep?: number;
    productLimit?: number;
    storageLimit?: number;
    staffLimit?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): Tenant {
    return new Tenant({
      ...props,
      currency: props.currency ?? 'VND',
      timezone: props.timezone ?? 'Asia/Ho_Chi_Minh',
      locale: props.locale ?? 'vi-VN',
      plan: props.plan ?? TenantPlan.BASIC,
      isActive: props.isActive ?? true,
      onboardingCompleted: props.onboardingCompleted ?? false,
      onboardingStep: props.onboardingStep ?? 0,
      productLimit: props.productLimit ?? 100,
      storageLimit: props.storageLimit ?? 1024,
      staffLimit: props.staffLimit ?? 2,
      currentProductCount: 0,
      currentStorageUsed: 0,
      currentStaffCount: 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPersistence(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  get name(): string {
    return this.props.name;
  }
  get ownerId(): string | undefined {
    return this.props.ownerId;
  }
  get domain(): string {
    return this.props.domain;
  }
  get plan(): TenantPlan {
    return this.props.plan;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  updateBranding(
    logoUrl?: string,
    faviconUrl?: string,
    themeConfig?: any,
  ): void {
    this.props.logoUrl = logoUrl;
    this.props.faviconUrl = faviconUrl;
    this.props.themeConfig = themeConfig;
    this.touch();
  }

  completeOnboarding(): void {
    this.props.onboardingCompleted = true;
    this.props.onboardingStep = 4; // Final step
    this.touch();
  }

  suspend(reason: string): void {
    this.props.isActive = false;
    this.props.suspendedAt = new Date();
    this.props.suspensionReason = reason;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.suspendedAt = undefined;
    this.props.suspensionReason = undefined;
    this.touch();
  }

  checkProductLimit(): void {
    if (this.props.currentProductCount >= this.props.productLimit) {
      throw new BusinessRuleViolationError(
        `Tenant product limit reached (${this.props.productLimit})`,
      );
    }
  }

  toPersistence(): Record<string, unknown> {
    return {
      ...this.props,
      id: this.id, // Ensure ID from base class is used
    };
  }
}
