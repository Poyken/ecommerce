import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';

/**
 * =====================================================================
 * UPDATE ADDRESS DTO - Đối tượng cập nhật địa chỉ
 * =====================================================================
 *
 * =====================================================================
 */

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
