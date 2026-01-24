import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../../domain/repositories/tenant.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../domain/repositories/user.repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '../../../domain/services/password-hasher.interface';
import { Tenant, TenantPlan } from '../../../domain/entities/tenant.entity';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@core/prisma/prisma.service';

export interface RegisterTenantInput {
  name: string;
  subdomain: string;
  email: string;
  password: string;
  plan?: string;
  referralCode?: string;
}

export interface RegisterTenantOutput {
  tenantId: string;
  ownerId: string;
  subdomain: string;
}

@Injectable()
export class RegisterTenantUseCase extends CommandUseCase<
  RegisterTenantInput,
  RegisterTenantOutput
> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly prisma: PrismaService, // Needed for transactional multiple repositories
  ) {
    super();
  }

  async execute(
    input: RegisterTenantInput,
  ): Promise<Result<RegisterTenantOutput>> {
    const subdomain = input.subdomain.toLowerCase();

    // 1. Validate Subdomain
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return Result.fail(
        new BusinessRuleViolationError('Subdomain không hợp lệ'),
      );
    }

    const reservedSubdomains = [
      'www',
      'api',
      'admin',
      'app',
      'mail',
      'help',
      'support',
      'docs',
      'blog',
    ];
    if (reservedSubdomains.includes(subdomain)) {
      return Result.fail(
        new BusinessRuleViolationError('Subdomain này đã được đặt trước'),
      );
    }

    // 2. Check existence
    const [existingTenant, existingUser] = await Promise.all([
      this.tenantRepository.findBySubdomain(subdomain),
      this.userRepository.findByEmailGlobal(input.email),
    ]);

    if (existingTenant) {
      return Result.fail(
        new BusinessRuleViolationError('Subdomain đã được sử dụng'),
      );
    }

    // Checking email global - if it exists as an owner elsewhere
    // The legacy code was: existing email as store owner.
    // Let's keep it simple: if email exists, fail for registration.
    if (existingUser) {
      return Result.fail(
        new BusinessRuleViolationError('Email đã được đăng ký'),
      );
    }

    // 3. Hash Password
    const passwordHash = await this.passwordHasher.hash(input.password);

    // 4. Create in Transaction
    // Clean Architecture tip: Cross-aggregate transactions usually happen in Service or using Outbox pattern.
    // Here we use Prisma transaction for simplicity as it's a critical signup flow.

    const result = await this.prisma.$transaction(async (tx) => {
      const tenantId = uuidv4();
      const userId = uuidv4();
      const roleId = uuidv4();

      // Create Tenant Entity
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const referralCode = `REF${subdomain.toUpperCase().slice(0, 4)}${Date.now().toString(36).toUpperCase()}`;

      // Just create data for Prisma directly in repo or use entity
      // I'll create the entities and save them via regular repos if possible, but $transaction needs the tx.
      // So I'll have to use tx directly or have repos that accept tx.
      // For registration which is multi-entity, I'll use tx directly to ensure atomicity.

      await tx.tenant.create({
        data: {
          id: tenantId,
          name: input.name,
          subdomain,
          domain: subdomain,
          plan: (input.plan?.toUpperCase() as any) || 'BASIC',
          ownerId: userId,
          referralCode,
          referredByCode: input.referralCode,
          trialEndsAt,
          trialStartedAt: new Date(),
        },
      });

      await tx.user.create({
        data: {
          id: userId,
          tenantId,
          email: input.email.toLowerCase(),
          password: passwordHash,
          // status: 'ACTIVE', // Handled by default or different field
          // emailVerified: true,
        } as any,
      });

      // Create Default Admin Role
      await tx.role.create({
        data: {
          id: roleId,
          tenantId,
          name: 'Admin',
        },
      });

      await tx.userRole.create({
        data: {
          userId,
          roleId,
        },
      });

      return { tenantId, userId, subdomain };
    });

    return Result.ok({
      tenantId: result.tenantId,
      ownerId: result.userId,
      subdomain: result.subdomain,
    });
  }
}
