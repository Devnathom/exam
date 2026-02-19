import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto, GenerateVersionsDto } from './dto/exam.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('exams')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.examsService.findAll(user.schoolId!, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.examsService.findOne(id, user.schoolId!);
  }

  @Post()
  @Roles('SCHOOL_ADMIN' as any, 'TEACHER' as any)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateExamDto) {
    return this.examsService.create(user.schoolId!, dto);
  }

  @Put(':id')
  @Roles('SCHOOL_ADMIN' as any, 'TEACHER' as any)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.update(id, user.schoolId!, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN' as any)
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.examsService.remove(id, user.schoolId!);
  }

  @Post(':id/versions')
  @Roles('SCHOOL_ADMIN' as any, 'TEACHER' as any)
  async generateVersions(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: GenerateVersionsDto,
  ) {
    return this.examsService.generateVersions(id, user.schoolId!, dto);
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.examsService.getExamVersions(id, user.schoolId!);
  }
}
