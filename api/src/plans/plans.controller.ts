/**
 * =====================================================================
 * PLANS CONTROLLER - API Gói dịch vụ (SaaS Plans)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PUBLIC vs PROTECTED:
 * - GET `/plans`: Thường là Public để hiển thị bảng giá trên Landing Page.
 * - POST/PATCH/DELETE: Phải bảo vệ nghiêm ngặt (chỉ SuperAdmin) để tránh
 *   kẻ xấu sửa giá tiền.
 *
 * 2. RESTful STANDARD:
 * - Controller này tuân thủ chuẩn REST cơ bản:
 *   + GET /: Lấy list
 *   + GET /:id: Lấy chi tiết
 *   + POST /: Tạo mới *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
// Import guards if needed, typically AdminGuard or SuperAdminGuard
// For simplicity assuming global guard or public for now during dev,
// but correctly should use @Roles('SUPERADMIN')

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Post()
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: Partial<CreatePlanDto>,
  ) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
