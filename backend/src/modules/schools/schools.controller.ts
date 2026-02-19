import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchoolsService } from './schools.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('schools')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  @Roles('SUPER_ADMIN' as any)
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.schoolsService.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN' as any)
  async create(@Body() data: { name: string; code: string; address?: string; phone?: string }) {
    return this.schoolsService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN' as any)
  async update(@Param('id') id: string, @Body() data: { name?: string; address?: string; phone?: string }) {
    return this.schoolsService.update(id, data);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN' as any)
  async remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}
