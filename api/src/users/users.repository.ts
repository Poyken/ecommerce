import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { BaseRepository } from '../core/repository/base.repository';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  protected readonly modelName = 'user';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email },
    });
  }
}
