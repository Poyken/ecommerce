import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  async create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  @Get()
  async findAll(@Query('type') type: string, @Query('page') page: number) {
    return this.mediaService.findAll(type, page ? Number(page) : 1);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}

