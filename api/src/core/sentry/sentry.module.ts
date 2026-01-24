/**
 * =====================================================================
 * SENTRY MODULE - TÍCH HỢP SENTRY VÀO NESTJS
 * =====================================================================
 *
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
