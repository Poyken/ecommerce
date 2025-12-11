import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("../auth/entities/user.entity").UserEntity>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: import("../auth/entities/user.entity").UserEntity[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<import("../auth/entities/user.entity").UserEntity>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("../auth/entities/user.entity").UserEntity>;
    assignRoles(id: string, dto: AssignRolesDto): Promise<import("../auth/entities/user.entity").UserEntity>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
