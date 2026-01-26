import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { TwoFactorService } from '@/identity/auth/two-factor.service';

@Injectable()
export class Generate2FAUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async execute(userId: string): Promise<Result<any>> {
    const user = await this.userRepository.findById(userId);
    if (!user) return Result.fail(new NotFoundException('User not found'));

    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.email.value);
    const qrCode = await this.twoFactorService.generateQrCodeDataURL(otpauthUrl);
    
    // We do NOT save secret yet, only when enabled.
    return Result.ok({ secret, qrCode });
  }
}
