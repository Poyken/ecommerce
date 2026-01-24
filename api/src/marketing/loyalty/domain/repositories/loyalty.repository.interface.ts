import {
  LoyaltyPoint,
  LoyaltyPointType,
} from '../entities/loyalty-point.entity';

export const LOYALTY_REPOSITORY = 'LOYALTY_REPOSITORY';

export abstract class ILoyaltyRepository {
  abstract findById(id: string): Promise<LoyaltyPoint | null>;
  abstract findByOrderId(
    orderId: string,
    type?: LoyaltyPointType,
  ): Promise<LoyaltyPoint[]>;
  abstract findByUser(
    tenantId: string,
    userId: string,
    options?: { page?: number; limit?: number },
  ): Promise<{ data: LoyaltyPoint[]; total: number }>;
  abstract save(point: LoyaltyPoint): Promise<LoyaltyPoint>;
  abstract sumAmount(
    tenantId: string,
    userId: string,
    filter?: { type?: LoyaltyPointType; activeOnly?: boolean },
  ): Promise<number>;
  abstract getSummary(
    tenantId: string,
    userId: string,
  ): Promise<{
    totalEarned: number;
    totalRedeemed: number;
    expiringSoon: number;
    nearestExpiry: Date | null;
  }>;
  abstract getAdminStats(tenantId: string): Promise<any>;
}
