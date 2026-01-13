import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateTaxRateDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ví dụ: VAT 10%, VAT 5%

  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number; // Tỷ lệ phần trăm (0-100)

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTaxRateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// DTO cho việc áp dụng thuế vào đơn hàng
export class ApplyTaxDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  taxRateId: string;
}
