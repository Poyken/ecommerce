export const PASSWORD_HASHER = 'PASSWORD_HASHER';

export abstract class IPasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract compare(password: string, hash: string): Promise<boolean>;
}
