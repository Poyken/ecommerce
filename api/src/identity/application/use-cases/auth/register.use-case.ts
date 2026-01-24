import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../domain/repositories/user.repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '../../../domain/services/password-hasher.interface';
import { User } from '../../../domain/entities/user.entity';
import { TokenService } from '@/identity/auth/token.service';
import { RedisService } from '@core/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterInput {
  email: string;
  password: string; // Plain password
  tenantId: string;
  firstName?: string;
  lastName?: string;
  fingerprint?: string;
}

export interface RegisterOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RegisterUseCase extends CommandUseCase<
  RegisterInput,
  RegisterOutput
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async execute(input: RegisterInput): Promise<Result<RegisterOutput>> {
    const email = input.email.toLowerCase().trim();

    // 1. Check uniqueness within tenant
    const existing = await this.userRepository.findByEmail(
      input.tenantId,
      email,
    );
    if (existing) {
      return Result.fail(
        new BusinessRuleViolationError('Email này đã được sử dụng'),
      );
    }

    // 2. Hash Password
    const passwordHash = await this.passwordHasher.hash(input.password);

    // 3. Create User
    const user = User.createCustomer({
      id: uuidv4(),
      tenantId: input.tenantId,
      email,
      passwordHash,
      profile: {
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    const savedUser = await this.userRepository.save(user);

    // 4. Generate Tokens
    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      savedUser.id,
      [],
      ['CUSTOMER'],
      input.fingerprint,
    );

    // 5. Store Refresh Token
    await this.redisService.set(
      `refreshToken:${savedUser.id}`,
      refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    return Result.ok({ accessToken, refreshToken });
  }
}
