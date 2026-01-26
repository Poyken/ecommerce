import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Result } from '@/core/application/result';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../../auth/entities/user.entity';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<Result<UserEntity>> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      return Result.fail(new NotFoundException('User not found'));
    }

    // Map Domain Entity to API Entity (DTO-like)
    // The existing UserEntity in auth/entities/user.entity.ts seems to be the DTO used for response
    // We might need to map from Domain User -> Auth UserEntity
    // For now, let's assume we can map manualy or check UserEntity structure
    
    // Quick Fix: The existing AuthService 'getMe' returns `new UserEntity(user as any)`. 
    // The repository returns a Domain User. We need to respect the response shape.
    
    const plainUser = {
        id: user.id,
        email: user.email.value,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        avatarUrl: user.profile.avatarUrl,
        role: user.role,
        status: user.status,
        emailVerified: user.isVerified,
        mfaEnabled: user.isMfaEnabled,
        // Add other fields if UserEntity expects them. 
        // Based on AuthService.getMe, it selects USER_SELECT_SAFE + addresses. 
        // Our repo logic maps everything to domain.
    };

    return Result.ok(new UserEntity(plainUser as any));
  }
}
