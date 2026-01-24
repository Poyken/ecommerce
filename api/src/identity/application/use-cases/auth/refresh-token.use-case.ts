import { Injectable, Inject, Logger } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { RedisService } from '@core/redis/redis.service';
import { TokenService } from '@/identity/auth/token.service';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../domain/repositories/user.repository.interface';
import { PermissionService } from '@/identity/auth/permission.service';

export interface RefreshTokenInput {
  refreshToken: string;
  fingerprint?: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase extends CommandUseCase<
  RefreshTokenInput,
  RefreshTokenOutput
> {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly permissionService: PermissionService,
  ) {
    super();
  }

  async execute(input: RefreshTokenInput): Promise<Result<RefreshTokenOutput>> {
    const { refreshToken, fingerprint } = input;

    // 1. Validate Token Structure
    const decoded = this.tokenService.validateRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      return Result.fail(
        new BusinessRuleViolationError(
          'Refresh token không hợp lệ hoặc đã hết hạn',
        ),
      );
    }

    // 2. Check Fingerprint (Anti-theft)
    if (decoded.fp && fingerprint && decoded.fp !== fingerprint) {
      this.logger.warn(
        `Phát hiện nghi vấn trộm token của user ${decoded.userId}`,
      );
      return Result.fail(
        new BusinessRuleViolationError('Token không hợp lệ (Lỗi Fingerprint)'),
      );
    }

    const userId = decoded.userId;

    // 3. Validate against Redis Whitelist
    const storedToken = await this.redisService.get(`refreshToken:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return Result.fail(
        new BusinessRuleViolationError(
          'Refresh token không hợp lệ hoặc đã bị thu hồi',
        ),
      );
    }

    // 4. Get User & Permissions
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(new BusinessRuleViolationError('User không tồn tại'));
    }

    // Usually permissions are fetched from DB roles/permissions.
    // Legacy service used aggregatePermissions on the fetched object.
    // I'll assume aggregatePermissions works with the entity's persistence object or adjust it.
    // Since we are refactoring, ideally we should move permission logic to UseCase or Domain Service.
    // For now, let's stick to the legacy service but use the persistence format if needed.
    const allPermissions = this.permissionService.aggregatePermissions(
      user.toPersistence() as any,
    );
    const roles = [(user as any).role]; // Minimal

    // 5. Generate New Tokens
    // Rotation: New Access + New Refresh
    const rolesArray = (user as any).roles
      ? (user as any).roles.map((r: any) => r.role.name)
      : [user.role];

    const tokens = this.tokenService.generateTokens(
      userId,
      allPermissions,
      rolesArray,
      fingerprint,
    );

    // 6. Update Redis provided the user is still active/valid
    await this.redisService.set(
      `refreshToken:${userId}`,
      tokens.refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    return Result.ok(tokens);
  }
}
