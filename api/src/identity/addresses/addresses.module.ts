import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';

/**
 * =====================================================================
 * ADDRESSES MODULE - Module quản lý địa chỉ
 * =====================================================================
 *
 * =====================================================================
 */
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  imports: [PrismaModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
