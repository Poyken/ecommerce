import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from '../../domain/services/password-hasher.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptPasswordHasher extends IPasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
