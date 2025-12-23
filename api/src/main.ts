/**
 * =====================================================================
 * MAIN BOOTSTRAP
 * =====================================================================
 */

import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerService } from './common/logger.service';

/**
 * Hàm Bootstrap - Khởi tạo và cấu hình ứng dụng
 */
async function bootstrap() {
  // Tạo instance ứng dụng NestJS
  // bufferLogs: true => Chỉ ghi log sau khi logger custom đã khởi tạo xong
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Khởi tạo LoggerService
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Bật Graceful Shutdown (Quan trọng cho Production)
  // Đảm bảo đóng kết nối DB, Redis... an toàn khi stop container
  app.enableShutdownHooks();

  // ============================================================================
  // 1. SECURITY - Bảo mật với Helmet
  // ============================================================================
  // Helmet thiết lập các HTTP headers bảo mật để chống lại các tấn công phổ biến:
  // - XSS (Cross-Site Scripting)
  // - Clickjacking
  // - MIME type sniffing
  app.use(helmet());

  // ============================================================================
  // 2. PERFORMANCE - Tối ưu hiệu năng với Compression
  // ============================================================================
  // Nén response (Gzip) để giảm băng thông và tăng tốc độ tải
  app.use(compression());

  // ============================================================================
  // 3. API PREFIX - Tiền tố API toàn cục
  // ============================================================================
  // Tất cả các route sẽ có prefix /api
  // Ví dụ: /api/v1/auth/login, /api/v1/products
  app.setGlobalPrefix('api');

  // ============================================================================
  // 4. API VERSIONING - Quản lý phiên bản API
  // ============================================================================
  // Cho phép versioning API qua URI (VD: /api/v1/..., /api/v2/...)
  // Mặc định sử dụng version 1
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ============================================================================
  // 5. CORS - Cross-Origin Resource Sharing
  // ============================================================================
  // Cấu hình CORS để kiểm soát domain nào được phép gọi API
  app.enableCors({
    origin: (origin, callback) => {
      // Danh sách domain được phép (whitelist)
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL
        'http://localhost:8080', // Cho phép chính server gọi (Swagger UI)
      ];

      // Cho phép request không có origin (VD: Postman, Mobile App)
      // hoặc nằm trong whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Đã chặn request CORS từ origin: ${origin}`);
        callback(new Error('Không được phép bởi CORS'));
      }
    },
    credentials: true, // Cho phép gửi cookies
  });

  // ============================================================================
  // 6. GLOBAL FILTERS & INTERCEPTORS - Xử lý tập trung
  // ============================================================================

  // 6.1. Exception Filter - Xử lý lỗi toàn cục
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter)); // Format lỗi chuẩn

  // 6.2. ClassSerializerInterceptor - Ẩn các field nhạy cảm (VD: password)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 6.3. TransformInterceptor - Format response chuẩn {data, message}
  app.useGlobalInterceptors(new TransformInterceptor());

  // ============================================================================
  // 7. VALIDATION - Validate dữ liệu đầu vào (DTO)
  // ============================================================================
  // Tự động validate và transform dữ liệu từ request
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field không khai báo trong DTO (Bảo mật)
      forbidNonWhitelisted: true, // Báo lỗi nếu gửi field thừa
      transform: true, // Tự động convert kiểu dữ liệu (VD: string '1' -> number 1)
      transformOptions: {
        enableImplicitConversion: true, // Cho phép convert ngầm định
      },
      disableErrorMessages: false, // Hiển thị thông báo lỗi chi tiết
    }),
  );

  // ============================================================================
  // 8. SWAGGER - API Documentation (Tài liệu API tự động)
  // ============================================================================
  // Cấu hình Swagger để tạo tài liệu API tự động
  const config = new DocumentBuilder()
    .setTitle('E-commerce API') // Tiêu đề
    .setDescription(
      'Tài liệu API cho hệ thống thương mại điện tử - Full Features', // Mô tả
    )
    .setVersion('1.0') // Phiên bản
    .addTag('Auth', 'Xác thực và phân quyền') // Tag cho nhóm endpoint
    .addTag('Products', 'Quản lý sản phẩm') // Tag cho nhóm endpoint
    .addTag('Orders', 'Quản lý đơn hàng') // Tag cho nhóm endpoint
    .addTag('Reviews', 'Quản lý đánh giá') // Tag cho nhóm endpoint
    .addBearerAuth() // Thêm nút nhập JWT Token trên Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Truy cập tại: http://localhost:8080/docs

  // ============================================================================
  // 9. START SERVER - Khởi động server
  // ============================================================================
  const port = process.env.PORT ?? 8080;
  await app.listen(port);

  logger.log(`🚀 Server is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

// Khởi động ứng dụng
bootstrap();
