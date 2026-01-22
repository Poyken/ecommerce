/**
 * =====================================================================
 * SENTRY INSTRUMENTATION - ERROR TRACKING & PERFORMANCE MONITORING
 * =====================================================================
 *
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
