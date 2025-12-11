import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Hanoi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Ba Dinh' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Lieu Giai', required: false })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({ example: '100000', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'Vietnam', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
