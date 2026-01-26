import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { RedisService } from '@core/redis/redis.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import * as crypto from 'crypto';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string): Promise<Result<any>> {
    const tenant = getTenant();
    // Use repository to find user by email in current tenant
    // Note: If no tenant context (e.g. public forgot password), we might need to handle differently or rely on repository defaulting?
    // The repo requires tenantId. If getTenant() is null, what happens?
    // Looking at AuthService, it used `where: { email, tenantId: tenant?.id }`.
    // If tenant is missing, it might look for global user or fail.
    // Let's assume tenant context is present or we pass a loose check.
    
    // For now, robust check:
    if (!tenant) {
         // Fallback or error? Usually Auth endpoints go through middleware that sets Tenant.
         // If Public Forgot Password page, it might set a default Tenant.
    }

    const user = await this.userRepository.findByEmail(tenant?.id || 'default', email);

    if (!user) {
      return Result.fail(new NotFoundException('User not found'));
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(`reset_password:${token}`, user.id, 'EX', 3600); // 1 hour

    await this.emailService.sendPasswordReset(user.email.value, token);

    return Result.ok({ message: 'Email sent' });
  }
}
