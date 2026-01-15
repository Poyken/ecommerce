/**
 * =====================================================================
 * SENTRY INSTRUMENTATION - ERROR TRACKING & PERFORMANCE MONITORING
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Sentry là dịch vụ theo dõi lỗi (Error Tracking) và hiệu năng (APM).
 *
 * 1. ERROR TRACKING:
 *    - Tự động capture mọi lỗi xảy ra trong app
 *    - Có stack trace, context, user info đầy đủ
 *    - Gửi alert qua email/Slack khi có lỗi critical
 *
 * 2. PERFORMANCE MONITORING:
 *    - Theo dõi thời gian response của từng request
 *    - Phát hiện các bottleneck (N+1 queries, slow DB calls)
 *    - Trace toàn bộ flow từ frontend -> backend -> database
 *
 * 3. RELEASE TRACKING:
 *    - Tag lỗi theo version để biết bug xuất hiện từ khi nào
 *    - Source map upload để xem code gốc thay vì minified
 *
 * 4. ENVIRONMENT CONFIG:
 *    - SENTRY_DSN: Data Source Name - URL để gửi data
 *    - sampleRate: % request được monitor (production nên < 100%) *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Centralized Monitoring: Dashboard duy nhất để theo dõi sức khỏe của toàn bộ hệ thống (API, Worker, DB).
 * - Performance Baseline: Giúp dev biết được "Bình thường" API chạy mất bao lâu, từ đó phát hiện sự cố "Tự nhiên chậm" (Regression).
 * - Security Auditing: Tự động lọc bỏ mật khẩu, token khỏi log trước khi gửi đi để tránh lộ thông tin người dùng.

 * =====================================================================
 */

import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry before any other imports
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',

  // Enable only if DSN is configured
  enabled: !!process.env.SENTRY_DSN,

  // Environment tagging
  environment: process.env.NODE_ENV || 'development',

  // Release version (should be set from CI/CD)
  release: process.env.APP_VERSION || '1.0.0',

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profiling (CPU profiling for performance analysis)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  integrations: [
    // Add profiling integration
    nodeProfilingIntegration(),
  ],

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Remove password fields from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data && typeof breadcrumb.data === 'object') {
          const data = { ...breadcrumb.data };
          if ('password' in data) delete data.password;
          if ('token' in data) delete data.token;
          breadcrumb.data = data;
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    'UnauthorizedException',
    'ForbiddenException',
    'NotFoundException',
    'BadRequestException',
  ],
});

export { Sentry };
