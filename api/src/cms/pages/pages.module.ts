/**
 * =====================================================================
 * PAGES.MODULE MODULE
 * =====================================================================
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService], // Export if other modules need it
})
export class PagesModule {}
