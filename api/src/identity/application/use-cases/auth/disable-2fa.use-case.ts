import { Inject, Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { TwoFactorService } from '@/identity/auth/two-factor.service';

@Injectable()
export class Disable2FAUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async execute(userId: string, token: string): Promise<Result<any>> {
    const user = await this.userRepository.findById(userId);
    if (!user) return Result.fail(new NotFoundException('User not found'));

    if (!user.isMfaEnabled || !user.mfaSecret) {
        return Result.fail(new UnauthorizedException('2FA chưa được kích hoạt'));
    }

    const isValid = this.twoFactorService.verifyToken(token, user.mfaSecret);
    if (!isValid) {
        return Result.fail(new UnauthorizedException('Mã xác thực không hợp lệ'));
    }

    user.disableMfa();
    await this.userRepository.save(user);

    return Result.ok({ message: 'Vô hiệu hóa 2FA thành công' });
  }
}
