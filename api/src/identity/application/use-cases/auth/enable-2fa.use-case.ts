import { Inject, Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { TwoFactorService } from '@/identity/auth/two-factor.service';

@Injectable()
export class Enable2FAUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async execute(userId: string, token: string, secret: string): Promise<Result<any>> {
    if (!token || !secret) {
        return Result.fail(new BadRequestException('Mã xác thực và mã bí mật là bắt buộc'));
    }

    const isValid = this.twoFactorService.verifyToken(token, secret);
    if (!isValid) {
        return Result.fail(new UnauthorizedException('Mã xác thực không hợp lệ'));
    }

    const user = await this.userRepository.findById(userId);
    if (!user) return Result.fail(new NotFoundException('User not found'));

    user.enableMfa(secret);
    await this.userRepository.save(user);

    return Result.ok({ message: 'Kích hoạt 2FA thành công' });
  }
}
