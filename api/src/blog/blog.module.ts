import { Module } from '@nestjs/common';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
