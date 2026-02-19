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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('students')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll(@CurrentUser() user: RequestUser, @Query() query: StudentQueryDto) {
    return this.studentsService.findAll(user.schoolId!, query);
  }

  @Get('classrooms')
  async getClassrooms(@CurrentUser() user: RequestUser) {
    return this.studentsService.getClassrooms(user.schoolId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.studentsService.findOne(id, user.schoolId!);
  }

  @Post()
  @Roles('SCHOOL_ADMIN' as any, 'TEACHER' as any)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(user.schoolId!, dto);
  }

  @Put(':id')
  @Roles('SCHOOL_ADMIN' as any, 'TEACHER' as any)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, user.schoolId!, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN' as any)
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.studentsService.remove(id, user.schoolId!);
  }

  @Post('import')
  @Roles('SCHOOL_ADMIN' as any, 'TEACHER' as any)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.importCsv(user.schoolId!, file.buffer);
  }
}
