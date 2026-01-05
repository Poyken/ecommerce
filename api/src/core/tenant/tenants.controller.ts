import { Controller, Get } from '@nestjs/common';
import { getTenant } from './tenant.context';

@Controller('tenants')
export class TenantsController {
  @Get('config')
  getTenantConfig() {
    const tenant = getTenant();
    if (!tenant) {
      // Return default config or null
      return {
        name: 'Default Store',
        themeConfig: {
          primaryColor: '#000000',
          borderRadius: '0.5rem',
        },
      };
    }

    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      themeConfig: tenant.themeConfig,
      plan: tenant.plan,
    };
  }
}
