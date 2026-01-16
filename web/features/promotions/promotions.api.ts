/**
 * Promotions API Client
 *
 * Re-exports promotionService for backward compatibility.
 * New code should import from services/promotion.service.ts directly.
 */

import { promotionService } from "./services/promotion.service";

// Re-export for backward compatibility
export const promotionsApi = promotionService;
