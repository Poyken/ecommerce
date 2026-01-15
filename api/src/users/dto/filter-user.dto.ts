import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/base.dto';

/**
 * DTO for filtering and paginating users.
 * Extends standard PaginationQueryDto.
 */
export class FilterUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm theo tên, email...',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo vai trò (Role name)',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString()
  role?: string;
}
