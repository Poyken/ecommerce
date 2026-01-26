import {
  Injectable,
  Inject,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../domain/repositories/user.repository.interface';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../../domain/repositories/tenant.repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '../../../domain/services/password-hasher.interface';
import { TokenService } from '@/identity/auth/token.service';
import { RedisService } from '@core/redis/redis.service';
import { PermissionService } from '@/identity/auth/permission.service';

export interface LoginInput {
  email: string;
  password: string; // Plain password from request
  tenantId?: string;
  fingerprint?: string;
  ip?: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  mfaRequired?: boolean;
  userId?: string;
}

@Injectable()
export class LoginUseCase extends CommandUseCase<LoginInput, LoginOutput> {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
  ) {
    super();
  }

  async execute(input: LoginInput): Promise<Result<LoginOutput>> {
    const email = input.email.toLowerCase().trim();

    // 1. Find user globally first (to handle multi-tenancy access)
    // Actually, in multi-tenancy, we usually look for user in tenant.
    // But system admins might login without tenant context if it's the global portal.
    const user = await this.userRepository.findByEmailGlobal(email);

    if (!user) {
      return Result.fail(
        new BusinessRuleViolationError('Thông tin đăng nhập không chính xác'),
      );
    }

    // 2. Check Password
    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      user.recordFailedLogin();
      await this.userRepository.save(user);
      return Result.fail(
        new BusinessRuleViolationError('Thông tin đăng nhập không chính xác'),
      );
    }

    // Check if user is locked
    if (user.isLocked) {
      return Result.fail(
        new BusinessRuleViolationError(
          'Tài khoản bị tạm khóa do nhập sai nhiều lần. Hãy thử lại sau 15 phút.',
        ),
      );
    }

    // 3. Tenancy Access Validation
    // Logic from legacy AuthService:
    // User can only access their own tenant, unless they are SUPERADMIN.
    const userTenant = await this.tenantRepository.findById(user.tenantId);

    // Flatten permissions
    // Legacy permissionService.aggregatePermissions needs the DB object usually.
    // I'll use the user entity and hope aggregatePermissions is compatible.
    const allPermissions = user.permissions;
    const roles = [(user as any).role]; // Minimal role detection

    if (input.tenantId && user.tenantId !== input.tenantId) {
      // Only SUPERADMIN can cross-tenant
      if (!(user as any).role.includes('SUPER_ADMIN')) {
        return Result.fail(
          new BusinessRuleViolationError(
            'Tài khoản không thuộc về cửa hàng này',
          ),
        );
      }
    }

    // 4. MFA Check
    if ((user as any).mfaEnabled) {
      return Result.ok({ mfaRequired: true, userId: user.id } as any);
    }

    // 5. Generate Tokens
    const rolesArray = (user as any).roles
      ? (user as any).roles.map((r: any) => r.role.name)
      : [user.role];

    const tokens = this.tokenService.generateTokens(
      user.id,
      [...allPermissions],
      rolesArray,
      input.fingerprint,
    );

    // Save Refresh Token to Redis
    await this.redisService.set(
      `refreshToken:${user.id}`,
      tokens.refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    // user.recordLogin();
    // await this.userRepository.save(user);

    return Result.ok(tokens);
  }
}
