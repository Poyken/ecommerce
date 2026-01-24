import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@/platform/integrations/external/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
/**
 * =====================================================================
 * BLOG MODULE
 * =====================================================================
 *
 * =====================================================================
 */
export class BlogModule {}
