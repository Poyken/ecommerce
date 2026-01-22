import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [PrismaModule],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
/**
 * =====================================================================
 * WISHLIST MODULE
 * =====================================================================
 *
 * =====================================================================
 */
export class WishlistModule {}
