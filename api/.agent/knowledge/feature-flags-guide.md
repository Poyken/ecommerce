# Feature Flags Guide

> **Purpose**: Enable/disable features per tenant without code deployment  
> **Use Cases**: A/B testing, gradual rollouts, tenant-specific features

---

## 1. Why Feature Flags?

### Problems Without Feature Flags

❌ **Deploy new feature** → All tenants get it immediately → High risk  
❌ **Bug found** → Rollback deployment → Affects all features  
❌ **Enterprise tenant** wants custom feature → Fork codebase → Maintenance nightmare

### Solutions With Feature Flags

✅ **Gradual rollout**: Enable for 10% → 50% → 100% users  
✅ **Kill switch**: Disable broken feature instantly without deployment  
✅ **Tenant-specific**: Enable AI chat only for premium tenants  
✅ **A/B testing**: Test new checkout flow with 50% users

---

## 2. Database Schema

### 2.1 Feature Flag Model

```prisma
// prisma/schema.prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique // e.g. "ai-chat", "advanced-analytics"
  name        String   // Display name: "AI Chat Assistant"
  description String?
  enabled     Boolean  @default(false) // Global default
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Tenant-specific overrides
  tenantOverrides TenantFeatureFlag[]

  @@index([key])
}

model TenantFeatureFlag {
  id        String      @id @default(cuid())
  tenantId  String
  tenant    Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  flagId    String
  flag      FeatureFlag @relation(fields: [flagId], references: [id], onDelete: Cascade)
  enabled   Boolean     // Override global setting
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@unique([tenantId, flagId])
  @@index([tenantId])
  @@index([flagId])
}
```

### 2.2 Generate Migration

```bash
cd api
npx prisma migrate dev --name add_feature_flags
```

---

## 3. Backend Implementation

### 3.1 Feature Flags Service

```typescript
// src/feature-flags/feature-flags.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if feature is enabled for given tenant
   * Priority: Tenant override > Global default
   */
  async isEnabled(key: string, tenantId?: string): Promise<boolean> {
    // Try tenant-specific override first
    if (tenantId) {
      const override = await this.prisma.tenantFeatureFlag.findFirst({
        where: {
          tenantId,
          flag: { key },
        },
      });

      if (override) {
        return override.enabled;
      }
    }

    // Fall back to global default
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    return flag?.enabled ?? false;
  }

  /**
   * Get all flags with tenant overrides
   */
  async getAllFlags(tenantId?: string) {
    const flags = await this.prisma.featureFlag.findMany({
      include: {
        tenantOverrides: tenantId ? { where: { tenantId } } : false,
      },
    });

    return flags.map((flag) => ({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled:
        tenantId && flag.tenantOverrides?.[0]
          ? flag.tenantOverrides[0].enabled
          : flag.enabled,
      hasOverride: !!flag.tenantOverrides?.[0],
    }));
  }

  /**
   * Set global flag
   */
  async setGlobalFlag(key: string, enabled: boolean) {
    await this.prisma.featureFlag.update({
      where: { key },
      data: { enabled },
    });
  }

  /**
   * Set tenant-specific override
   */
  async setTenantFlag(key: string, tenantId: string, enabled: boolean) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag) {
      throw new Error(`Feature flag ${key} not found`);
    }

    await this.prisma.tenantFeatureFlag.upsert({
      where: {
        tenantId_flagId: {
          tenantId,
          flagId: flag.id,
        },
      },
      create: {
        tenantId,
        flagId: flag.id,
        enabled,
      },
      update: {
        enabled,
      },
    });
  }
}
```

### 3.2 Feature Flag Decorator

```typescript
// src/common/decorators/feature-flag.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';
export const RequireFeature = (flagKey: string) =>
  SetMetadata(FEATURE_FLAG_KEY, flagKey);
```

### 3.3 Feature Flag Guard

```typescript
// src/common/guards/feature-flag.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagsService } from '@/feature-flags/feature-flags.service';
import { FEATURE_FLAG_KEY } from '@/common/decorators/feature-flag.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlags: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagKey = this.reflector.get<string>(
      FEATURE_FLAG_KEY,
      context.getHandler(),
    );

    if (!flagKey) {
      return true; // No feature flag required
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    const enabled = await this.featureFlags.isEnabled(flagKey, tenantId);

    if (!enabled) {
      throw new ForbiddenException(
        `Feature "${flagKey}" is not enabled for this tenant`,
      );
    }

    return true;
  }
}
```

### 3.4 Usage in Controllers

```typescript
// src/ai/ai.controller.ts
import { RequireFeature } from '@/common/decorators/feature-flag.decorator';
import { FeatureFlagGuard } from '@/common/guards/feature-flag.guard';

@Controller('ai')
@UseGuards(FeatureFlagGuard)
export class AiController {
  @Post('chat')
  @RequireFeature('ai-chat')
  async chat(@Body() dto: ChatDto) {
    // Only accessible if "ai-chat" flag enabled for tenant
    return this.aiService.chat(dto);
  }

  @Post('generate-description')
  @RequireFeature('ai-product-description')
  async generateDescription(@Body() dto: ProductDto) {
    return this.aiService.generateDescription(dto);
  }
}
```

---

## 4. Frontend Integration

### 4.1 API Endpoint

```typescript
// feature-flags.controller.ts
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private service: FeatureFlagsService) {}

  @Get()
  async getFlags(@CurrentUser() user: User) {
    const flags = await this.service.getAllFlags(user.tenantId);
    return { flags };
  }
}
```

### 4.2 Frontend Hook (Next.js)

```typescript
// web/lib/hooks/use-feature-flags.ts
import useSWR from 'swr';

interface FeatureFlags {
  [key: string]: boolean;
}

export function useFeatureFlags() {
  const { data, error, isLoading } = useSWR<{ flags: FeatureFlags }>(
    '/api/v1/feature-flags',
  );

  return {
    flags: data?.flags ?? {},
    isEnabled: (key: string) => data?.flags?.[key] ?? false,
    isLoading,
    error,
  };
}
```

### 4.3 Usage in Components

```typescript
// web/components/ai-chat-widget.tsx
import { useFeatureFlags } from '@/lib/hooks/use-feature-flags';

export function AIChatWidget() {
  const { isEnabled, isLoading } = useFeatureFlags();

  if (isLoading) return <Skeleton />;

  if (!isEnabled('ai-chat')) {
    return null; // Hide widget if feature disabled
  }

  return <ChatInterface />;
}
```

### 4.4 Graceful Degradation

```typescript
// Show upgrade prompt instead of hiding
export function AdvancedAnalytics() {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled('advanced-analytics')) {
    return (
      <UpgradeBanner
        title="Advanced Analytics"
        description="Upgrade to Premium to unlock advanced analytics"
      />
    );
  }

  return <AnalyticsDashboard />;
}
```

---

## 5. Admin UI

### 5.1 Feature Flags Management Page

```typescript
// web/app/admin/feature-flags/page.tsx
export default async function FeatureFlagsPage() {
  const flags = await getAllFlags();

  return (
    <div>
      <h1>Feature Flags</h1>
      <FeatureFlagsList flags={flags} />
    </div>
  );
}
```

### 5.2 Toggle Component

```typescript
// web/components/admin/feature-flag-toggle.tsx
'use client';

import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

export function FeatureFlagToggle({ flag, tenantId }: Props) {
  const [enabled, setEnabled] = useState(flag.enabled);

  const handleToggle = async () => {
    const res = await fetch(`/api/v1/feature-flags/${flag.key}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !enabled, tenantId }),
    });

    if (res.ok) {
      setEnabled(!enabled);
      toast.success(`Feature ${enabled ? 'disabled' : 'enabled'}`);
    }
  };

  return (
    <Switch
      checked={enabled}
      onCheckedChange={handleToggle}
      aria-label={`Toggle ${flag.name}`}
    />
  );
}
```

---

## 6. Common Patterns

### 6.1 Gradual Rollout

```typescript
// Rollout feature to 10% of users
async rolloutGradually(flagKey: string, percentage: number) {
  const tenants = await this.prisma.tenant.findMany();
  const enableCount = Math.floor(tenants.length * (percentage / 100));

  // Randomly select tenants
  const shuffled = tenants.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, enableCount);

  for (const tenant of selected) {
    await this.setTenantFlag(flagKey, tenant.id, true);
  }
}

// Usage
await featureFlags.rolloutGradually('new-checkout', 10); // 10%
```

### 6.2 Time-based Flags

```typescript
model FeatureFlag {
  // ... existing fields
  enabledFrom  DateTime?  // Enable from date
  enabledUntil DateTime?  // Auto-disable after date
}

async isEnabled(key: string, tenantId?: string): Promise<boolean> {
  const flag = await this.getFlag(key, tenantId);
  const now = new Date();

  // Check time-based constraints
  if (flag.enabledFrom && now < flag.enabledFrom) return false;
  if (flag.enabledUntil && now > flag.enabledUntil) return false;

  return flag.enabled;
}
```

### 6.3 User-based Flags

```typescript
model UserFeatureFlag {
  id       String      @id @default(cuid())
  userId   String
  user     User        @relation(fields: [userId], references: [id])
  flagId   String
  flag     FeatureFlag @relation(fields: [flagId], references: [id])
  enabled  Boolean

  @@unique([userId, flagId])
}

// Check priority: User override > Tenant override > Global
async isEnabled(key: string, userId?: string, tenantId?: string): Promise<boolean> {
  if (userId) {
    const userFlag = await this.getUserFlag(key, userId);
    if (userFlag) return userFlag.enabled;
  }

  if (tenantId) {
    const tenantFlag = await this.getTenantFlag(key, tenantId);
    if (tenantFlag) return tenantFlag.enabled;
  }

  const globalFlag = await this.getGlobalFlag(key);
  return globalFlag?.enabled ?? false;
}
```

---

## 7. Seeding Default Flags

```typescript
// prisma/seed.ts
const defaultFlags = [
  {
    key: 'ai-chat',
    name: 'AI Chat Assistant',
    description: 'Enable AI-powered customer support chatbot',
    enabled: false, // Disabled by default (premium feature)
  },
  {
    key: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Detailed sales analytics and forecasting',
    enabled: false,
  },
  {
    key: 'multi-warehouse',
    name: 'Multi-Warehouse',
    description: 'Track inventory across multiple warehouses',
    enabled: true, // Enabled by default
  },
  {
    key: 'bulk-import',
    name: 'Bulk Product Import',
    description: 'Import products via CSV/Excel',
    enabled: true,
  },
];

for (const flag of defaultFlags) {
  await prisma.featureFlag.upsert({
    where: { key: flag.key },
    update: {},
    create: flag,
  });
}
```

---

## 8. Best Practices

### DO

- ✅ Use descriptive flag keys (`ai-chat`, not `feature1`)
- ✅ Add descriptions for non-technical users
- ✅ Cache flag values (Redis, 60s TTL)
- ✅ Log flag changes (audit trail)
- ✅ Clean up unused flags after full rollout

### DON'T

- ❌ Use for business logic (use configuration instead)
- ❌ Create too many flags (maintenance burden)
- ❌ Leave flags forever (technical debt)
- ❌ Use for secrets/credentials
- ❌ Forget to test both enabled/disabled states

---

## 9. Testing

### Unit Test

```typescript
describe('FeatureFlagsService', () => {
  it('should return tenant override over global default', async () => {
    // Global: disabled
    await service.setGlobalFlag('ai-chat', false);

    // Tenant override: enabled
    await service.setTenantFlag('ai-chat', 'tenant1', true);

    const result = await service.isEnabled('ai-chat', 'tenant1');
    expect(result).toBe(true);
  });
});
```

### E2E Test

```typescript
describe('Feature Flag Protected Endpoint', () => {
  it('should deny access when flag disabled', async () => {
    await featureFlags.setTenantFlag('ai-chat', tenant.id, false);

    const res = await request(app.getHttpServer())
      .post('/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('not enabled');
  });
});
```

---

## 10. Monitoring

Track flag usage:

```typescript
// Increment counter when flag is checked
await this.metrics.increment('feature_flag_check', {
  flag: key,
  tenant: tenantId,
  enabled: String(result),
});
```

Dashboard metrics:

- Most checked flags
- Flags with low usage (candidates for removal)
- Rollout progress (% tenants enabled)

---

**Next**: [background-jobs-guide.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/background-jobs-guide.md) để setup background job processing
