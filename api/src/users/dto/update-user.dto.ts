import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

/**
 * =====================================================================
 * UPDATE USER DTO - Đối tượng cập nhật người dùng
 * =====================================================================
 */

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'newpassword123', minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải ít nhất 6 ký tự' })
  password?: string;
}

export class AssignRolesDto {
  @ApiProperty({
    example: ['ADMIN', 'MANAGER'],
    description: 'Danh sách tên Roles cần gán',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  roles: string[];
}
