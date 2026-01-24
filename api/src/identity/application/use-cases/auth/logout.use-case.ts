import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { RedisService } from '@core/redis/redis.service';

export interface LogoutInput {
  userId: string;
  jti?: string;
}

export type LogoutOutput = { message: string };

@Injectable()
export class LogoutUseCase extends CommandUseCase<
  LogoutInput,
  LogoutOutput
> {
  constructor(
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async execute(input: LogoutInput): Promise<Result<LogoutOutput>> {
    if (input.jti) {
      // Blacklist token for safety
      await this.redisService.set(`jwt:revoked:${input.jti}`, 'true', 'EX', 900);
    }
    
    // Remove Refresh Token
    await this.redisService.del(`refreshToken:${input.userId}`);

    return Result.ok({ message: 'Logged out successfully' });
  }
}
