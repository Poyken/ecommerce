import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    description: 'Danh sách các role cần gán cho user',
    example: ['admin', 'manager'],
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}
