/**
 * =====================================================================
 * SENTRY MODULE - TÍCH HỢP SENTRY VÀO NESTJS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này cung cấp SentryService và SentryInterceptor cho toàn app.
 *
 * 1. GLOBAL FILTER:
 *    - Bắt tất cả exception chưa được handle
 *    - Tự động gửi lên Sentry với context đầy đủ
 *
 * 2. REQUEST CONTEXT:
 *    - Mỗi request được tag với user info, request ID
 *    - Dễ dàng trace lỗi từ frontend -> backend
 *
 * 3. MANUAL CAPTURE:
 *    - Sử dụng SentryService để capture error thủ công
 *    - Hữu ích cho async errors, background jobs
 * =====================================================================
 */

import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import {
  SentryGlobalFilter,
  SentryModule as SentryNestModule,
} from '@sentry/nestjs/setup';

@Global()
@Module({
  imports: [SentryNestModule.forRoot()],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
  exports: [],
})
export class SentryModule {}
