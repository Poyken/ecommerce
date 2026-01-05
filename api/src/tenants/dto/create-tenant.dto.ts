import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Furniture Store' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'furniture.local' })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({
    example: 'BASIC',
    enum: ['BASIC', 'PRO', 'ENTERPRISE'],
  })
  @IsEnum(['BASIC', 'PRO', 'ENTERPRISE'])
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';

  @ApiPropertyOptional({ example: { primaryColor: '#000000' } })
  @IsObject()
  @IsOptional()
  themeConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: 'admin@example.com' })
  @IsString()
  @IsOptional()
  adminEmail?: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsString()
  @IsOptional()
  adminPassword?: string;
}
