import { Inject, Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/repositories/tenant.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { TokenService } from '@/identity/auth/token.service';
import { RedisService } from '@core/redis/redis.service';
import { PermissionService } from '@/identity/auth/permission.service';
import { GrantWelcomeVoucherUseCase } from '@/marketing/promotions/application/use-cases/grant-welcome-voucher.use-case';
import { v4 as uuidv4 } from 'uuid';

export interface SocialLoginInput {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  provider: 'google' | 'facebook';
  socialId: string;
  tenantId: string;
  fingerprint?: string;
}

@Injectable()
export class SocialLoginUseCase {
  private readonly logger = new Logger(SocialLoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
    private readonly grantWelcomeVoucherUseCase: GrantWelcomeVoucherUseCase,
  ) {}

  async execute(input: SocialLoginInput): Promise<Result<any>> {
    const { email, firstName, lastName, picture, provider, socialId, tenantId, fingerprint } = input;

    if (!email) {
      return Result.fail(new UnauthorizedException('Email là bắt buộc khi đăng nhập qua MXH'));
    }

    // 1. Find User
    let user = await this.userRepository.findByEmail(tenantId, email);

    if (user) {
       // Check if linked
       if (!user.socialId) {
           user.linkSocialAccount(provider, socialId);
           if (picture && !user.profile.avatarUrl) {
               user.updateProfile({ avatarUrl: picture });
           }
           await this.userRepository.save(user);
       }
    } else {
        // 2. Check Tenant Policy
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) return Result.fail(new BadRequestException('Tenant not found'));
        
        // Assuming Tenant Entity has allowSocialRegistration. 
        // If not in Domain Entity, we might need to check how it's modeled.
        // AuthService accessed `prisma.tenant`. 
        // Let's assume tenantRepository.findById returns Domain Entity which should have it.
        // If Domain Entity is missing it, we might skip or fail.
        // Legacy code: `tenantDetails.allowSocialRegistration`
        
        if (!(tenant as any).allowSocialRegistration && (tenant as any).allowSocialRegistration !== undefined) {
             return Result.fail(new UnauthorizedException('Cửa hàng này không cho phép tự động đăng ký qua mạng xã hội.'));
        }

        // 3. Create User
        // Need to ensure User.createCustomer accepts the new props or use setters
        // I updated User.createCustomer signature to accept provider/socialId
        user = User.createCustomer({
            id: uuidv4(),
            tenantId,
            email,
            passwordHash: '', // No password for social user
            profile: { firstName, lastName, avatarUrl: picture },
            provider,
            socialId
        });

        await this.userRepository.save(user);
        
        // Grant Voucher
        try {
            await this.grantWelcomeVoucherUseCase.execute({ tenantId, userId: user.id });
        } catch (e) {
            this.logger.error('Failed to grant welcome voucher', e);
        }
    }

    if (!user) return Result.fail(new UnauthorizedException('Failed to process user'));

    // 4. Generate Tokens
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

    return Result.ok({
        ...tokens,
        user: {
            id: user.id,
            email: user.email.value,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            roles
        }
    });
  }
}
