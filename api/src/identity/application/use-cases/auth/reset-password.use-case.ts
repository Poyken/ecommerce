import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { PASSWORD_HASHER, IPasswordHasher } from '../../../domain/services/password-hasher.interface';
import { RedisService } from '@core/redis/redis.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { ResetPasswordDto } from '../../../auth/dto/reset-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<Result<any>> {
    const { token, newPassword } = dto;
    const userId = await this.redisService.get(`reset_password:${token}`);
    
    if (!userId) {
      return Result.fail(new BadRequestException('Invalid or expired token'));
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(new NotFoundException('User not found'));
    }

    const newHashedPassword = await this.passwordHasher.hash(newPassword);
    user.changePassword(newHashedPassword);
    
    await this.userRepository.save(user);
    await this.redisService.del(`reset_password:${token}`);

    // Send confirmation email
    await this.emailService.sendPasswordResetSuccess(user.email.value);

    return Result.ok({ message: 'Password updated' });
  }
}
