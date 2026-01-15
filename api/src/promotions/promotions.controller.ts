import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
// import { PermissionsGuard } from '@/auth/permissions.guard';
// import { RequirePermissions } from '@/common/decorators/crud.decorators';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.promotionsService.findAll();
  }

  @Get('validate')
  async validate(@Query('code') code: string, @Query('amount') amount: string) {
    return this.promotionsService.validatePromotion(code, {
      totalAmount: parseFloat(amount),
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }
}
