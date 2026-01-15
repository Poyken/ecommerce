<<<<<<< HEAD
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('promotion:create')
  @ApiOperation({ summary: 'Create new promotion (Admin)' })
  create(@Body() dto: CreatePromotionDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
=======
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
>>>>>>> 8f5a875198d5ce2371ec25b2aeb50dc403c8c172
  }
}
