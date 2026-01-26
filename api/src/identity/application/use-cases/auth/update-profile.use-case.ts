import { Inject, Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { PASSWORD_HASHER, IPasswordHasher } from '../../../domain/services/password-hasher.interface';
import { UpdateProfileDto } from '../../../auth/dto/update-profile.dto';
import { EmailService } from '@/platform/integrations/external/email/email.service';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailService: EmailService,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<Result<any>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(new NotFoundException('User not found'));
    }

    const { password, newPassword, ...updateData } = dto as any;

    // Handle Password Change
    if (password && newPassword) {
        if (!user.passwordHash) {
             return Result.fail(new BadRequestException('User has no password set (Social Login)'));
        }

        const isPasswordValid = await this.passwordHasher.compare(password, user.passwordHash);
        if (!isPasswordValid) {
             return Result.fail(new UnauthorizedException('Mật khẩu hiện tại không đúng'));
        }

        const newHashedPassword = await this.passwordHasher.hash(newPassword);
        user.changePassword(newHashedPassword);
        
        // Send email async
        this.emailService.sendPasswordResetSuccess(user.email.value).catch(() => {});
    }

    // Handle other updates
    if (updateData.firstName || updateData.lastName || updateData.phone || updateData.avatarUrl) {
        user.updateProfile({
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            phone: updateData.phone,
            avatarUrl: updateData.avatarUrl
        });
    }

    await this.userRepository.save(user);

    return Result.ok({ success: true });
  }
}
