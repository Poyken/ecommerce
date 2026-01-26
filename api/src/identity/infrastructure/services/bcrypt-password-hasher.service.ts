import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from '../../domain/services/password-hasher.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptPasswordHasher extends IPasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    const match = await bcrypt.compare(plain, hashed);
    if (!match) {
        console.log('DEBUG BCRYPT FAIL:', { plain, hashed, match });
    }
    return match;
  }
}
