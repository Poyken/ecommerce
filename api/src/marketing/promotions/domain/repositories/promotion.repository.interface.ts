import { Promotion } from '../entities/promotion.entity';

export const PROMOTION_REPOSITORY = 'PROMOTION_REPOSITORY';

export interface PromotionFilter {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export abstract class IPromotionRepository {
  abstract findById(id: string): Promise<Promotion | null>;
  abstract findByCode(
    tenantId: string,
    code: string,
  ): Promise<Promotion | null>;
  abstract findMany(
    tenantId: string,
    filter: PromotionFilter,
  ): Promise<{ data: Promotion[]; total: number }>;
  abstract findActive(tenantId: string): Promise<Promotion[]>;
  abstract save(promotion: Promotion): Promise<Promotion>;
  abstract delete(id: string): Promise<void>;
  abstract countUsage(promotionId: string, userId?: string): Promise<number>;
  abstract saveUsage(usage: {
    id: string;
    promotionId: string;
    userId: string;
    orderId: string;
    discountAmount: number;
    tenantId: string;
  }): Promise<void>;
}
