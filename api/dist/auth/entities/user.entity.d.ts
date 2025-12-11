import { User } from '@prisma/client';
export declare class UserEntity implements Partial<User> {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    roles: any[];
    permissions: any[];
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<UserEntity> | any);
    get flattenedRoles(): string[];
    get flattenedPermissions(): string[];
}
