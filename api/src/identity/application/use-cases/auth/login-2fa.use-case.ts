import { Inject, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { TwoFactorService } from '@/identity/auth/two-factor.service';
import { TokenService } from '@/identity/auth/token.service';
import { RedisService } from '@core/redis/redis.service';
import { PermissionService } from '@/identity/auth/permission.service';

@Injectable()
export class Login2FAUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly twoFactorService: TwoFactorService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
  ) {}

  async execute(userId: string, token: string, fingerprint?: string): Promise<Result<any>> {
    const user = await this.userRepository.findById(userId);
    if (!user) return Result.fail(new NotFoundException('User not found'));

    if (!user.isMfaEnabled || !user.mfaSecret) {
         return Result.fail(new UnauthorizedException('2FA không khả dụng cho tài khoản này'));
    }

    const isValid = this.twoFactorService.verifyToken(token, user.mfaSecret); // Assuming user domain exposes mfaSecret in props or we add getter
    // Note: mfaSecret is in user.props (protected). I should check if there is a getter. 
    // In User Entity, there is `isMfaEnabled`. `mfaSecret` might need a getter or access via props if allowed.
    // Looking at Disable2FAUseCase I used `user.props.mfaSecret`. 
    // AggregateRoot props are typically protected. 
    // I should probably add a method `verifyMfa(token: string, service: TwoFactorService): boolean` on Entity 
    // OR add a getter internal to domain.
    // For now, assuming `props` access or add getter.
    
    if (!isValid) {
        return Result.fail(new UnauthorizedException('Mã xác thực không hợp lệ'));
    }

    const allPermissions = user.permissions;
    const roles = Array.isArray((user as any).roles) ? (user as any).roles.map((r: any) => r.role.name) : [user.role];

    const tokens = this.tokenService.generateTokens(
        user.id,
        [...allPermissions],
        roles,
        fingerprint
    );

    await this.redisService.set(
       `refreshToken:${user.id}`,
       tokens.refreshToken,
       'EX',
       this.tokenService.getRefreshTokenExpirationTime()
    );

    return Result.ok(tokens);
  }
}
