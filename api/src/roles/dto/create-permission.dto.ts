import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name in format resource:action',
    example: 'product:create',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
