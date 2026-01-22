/**
 * =====================================================================
 * PLANS CONTROLLER - API Gói dịch vụ (SaaS Plans)
 * =====================================================================
 *
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
