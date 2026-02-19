import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ResultsService } from './results.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('results')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('exam/:examId')
  async findByExam(
    @Param('examId') examId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.resultsService.findByExam(
      examId,
      user.schoolId!,
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  @Get('student/:studentId')
  async findByStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.resultsService.findByStudent(studentId, user.schoolId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.resultsService.findOne(id, user.schoolId!);
  }

  @Get('exam/:examId/export')
  async exportResults(
    @Param('examId') examId: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const data = await this.resultsService.exportExamResults(examId, user.schoolId!);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=results.json');
    res.json(data);
  }
}
