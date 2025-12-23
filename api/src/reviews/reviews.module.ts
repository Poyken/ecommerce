import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * =====================================================================
 * REVIEWS MODULE - Module quản lý đánh giá và phản hồi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SOCIAL PROOF (Bằng chứng xã hội):
 * - Module này đóng vai trò cực kỳ quan trọng trong việc xây dựng lòng tin với khách hàng.
 * - Các đánh giá thật từ người mua giúp tăng tỷ lệ chuyển đổi (Conversion Rate) cho website.
 *
 * 2. ARCHITECTURE:
 * - Sử dụng `PrismaModule` để lưu trữ nội dung đánh giá và điểm số (Rating).
 * - Tách biệt rõ ràng giữa logic cho khách hàng (viết review) và Admin (quản lý/xóa review).
 * =====================================================================
 */
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NotificationsModule],
  providers: [ReviewsService],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
