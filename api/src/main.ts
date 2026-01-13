// QUAN TRỌNG: Import Sentry đầu tiên trước mọi thứ khác để đảm bảo bắt trọn lỗi!
import './core/sentry/instrument';

/**
 * =====================================================================
 * MAIN BOOTSTRAP - ĐIỂM KHỞI CHẠY ỨNG DỤNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là file quan trọng nhất (Entry Point) của ứng dụng NestJS.
 * Nó chịu trách nhiệm:
 * 1. Khởi tạo instance ứng dụng (`NestFactory.create`).
 * 2. Cấu hình Middleware toàn cục (Global Middleware):
 *    - Security (Helmet, CORS): Bảo mật HTTP headers và chặn request trái phép.
 *    - Performance (Compression): Nén Gzip response để giảm dung lượng tải.
 *    - Logging: Ghi log chuẩn format JSON để dễ debug và trace.
 * 3. Cấu hình Pipes & Interceptors toàn cục:
 *    - ValidationPipe: Tự động kiểm tra và convert dữ liệu đầu vào (DTO).
 *    - TransformInterceptor: Chuẩn hóa format trả về { data, message, statusCode }.
 *    - AllExceptionsFilter: Bắt lỗi tập trung và trả về lỗi đẹp thay vì stack trace thô.
 * 4. Tạo tài liệu API (Swagger) tự động tại `/docs`.
 * 5. [NEW] Sentry error tracking và performance monitoring (Theo dõi lỗi và hiệu năng).
 * =====================================================================
 */

import { SECURITY_HEADERS } from '@core/config/constants';
import { LoggerService } from '@core/logger/logger.service';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Hàm Bootstrap - Khởi tạo và cấu hình ứng dụng
 */
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';

async function bootstrap() {
  // Tạo instance ứng dụng NestJS
  // bufferLogs: true => Chỉ ghi log sau khi logger custom đã khởi tạo xong, tránh mất log lúc khởi động
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Enable trust proxy để lấy đúng IP người dùng khi chạy sau Nginx/Load Balancer
  app.set('trust proxy', 1);

  // Khởi tạo LoggerService (sử dụng Winston) thay thế cho logger mặc định
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Bật Graceful Shutdown (Quan trọng cho Production)
  // Đảm bảo đóng kết nối DB, Redis... an toàn hủy các process cũ khi deploy mới
  app.enableShutdownHooks();

  // ============================================================================
  // 1. SECURITY - Bảo mật với Helmet
  // ============================================================================
  // Helmet thiết lập các HTTP headers bảo mật để chống lại các tấn công phổ biến:
  // - XSS (Cross-Site Scripting): Chèn mã độc vào trang web
  // - Clickjacking: Lừa người dùng click vào nút ẩn
  // - MIME type sniffing: Giả dạng kiểu file
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: SECURITY_HEADERS.CSP_DIRECTIVES,
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: SECURITY_HEADERS.HSTS_MAX_AGE,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      dnsPrefetchControl: { allow: true },
    }),
  );

  // Sử dụng cookie-parser để đọc cookie từ request (cho JWT trong cookie)
  app.use(cookieParser());

  // ============================================================================
  // LIMITS - Giới hạn kích thước request để tránh tấn công DoS
  // ============================================================================
  const { json, urlencoded } = await import('express');
  app.use(json({ limit: '5mb' })); // Giới hạn JSON body 5MB
  app.use(urlencoded({ extended: true, limit: '5mb' })); // Giới hạn Form data 5MB

  // ============================================================================
  // 2. PERFORMANCE - Tối ưu hiệu năng với Compression
  // ============================================================================
  // Nén response (Gzip) để giảm băng thông và tăng tốc độ tải cho Client
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
  // Giúp nâng cấp API mà không làm hỏng app cũ của người dùng
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ============================================================================
  // 5. CORS - Cross-Origin Resource Sharing
  // ============================================================================
  // Cấu hình CORS để kiểm soát domain nào được phép gọi API (Frontend, Mobile App)
  app.enableCors({
    origin: (origin, callback) => {
      // Danh sách domain được phép (whitelist)
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:8080',
        'https://web-five-gilt-79.vercel.app', // Production Domain
      ].filter(Boolean); // Lọc bỏ giá trị undefined/null

      // 1. Cho phép request không có origin (Server-to-Server, Tools like Postman)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Check trong whitelist cứng
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Cho phép dynamic Localhost & Local Network (cho Dev environment)
      // Giúp developers chạy trên IP mạng LAN (ví dụ view trên điện thoại)
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://192.168.')
      ) {
        return callback(null, true);
      }

      // 4. Chặn (Block)
      logger.warn(`🚫 CORS Blocked Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Cho phép gửi cookies/headers xác thực
  });

  // ============================================================================
  // 6. GLOBAL FILTERS & INTERCEPTORS - Xử lý tập trung
  // ============================================================================

  // 6.1. Exception Filter - Xử lý lỗi toàn cục
  // Bắt mọi lỗi, log ra Sentry/Console và trả về JSON chuẩn cho Client
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // 6.2. ClassSerializerInterceptor - Ẩn các field nhạy cảm
  // Tự động loại bỏ các field có @Exclude() (như password, salt) khỏi response
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 6.3. TransformInterceptor - Format response chuẩn
  // Bọc mọi response thành { success: true, data: ..., message: ... }
  app.useGlobalInterceptors(new TransformInterceptor());

  // ============================================================================
  // 7. VALIDATION - Validate dữ liệu đầu vào (DTO)
  // ============================================================================
  // Tự động validate và transform dữ liệu từ request body/params
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field không khai báo trong DTO (Bảo mật)
      forbidNonWhitelisted: true, // Báo lỗi nếu gửi field thừa (Chặt chẽ)
      transform: true, // Tự động convert kiểu dữ liệu (VD: string '1' -> number 1)
      transformOptions: {
        enableImplicitConversion: true, // Cho phép convert ngầm định
      },
      disableErrorMessages: false, // Hiển thị thông báo lỗi chi tiết (Dev friendly)
    }),
  );

  // ============================================================================
  // 8. SWAGGER - API Documentation (Tài liệu API tự động)
  // ============================================================================
  // Cấu hình Swagger để tạo tài liệu API tự động, giúp Frontend/Mobile team dễ tích hợp
  const config = new DocumentBuilder()
    .setTitle('E-commerce API') // Tiêu đề
    .setDescription(
      'Tài liệu API cho hệ thống thương mại điện tử - Full Features', // Mô tả
    )
    .setVersion('1.0') // Phiên bản
    .addTag('Auth', 'Xác thực và phân quyền')
    .addTag('Products', 'Quản lý sản phẩm')
    .addTag('Orders', 'Quản lý đơn hàng')
    .addTag('Reviews', 'Quản lý đánh giá')
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
