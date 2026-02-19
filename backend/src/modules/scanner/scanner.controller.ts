import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScannerService } from './scanner.service';
import { SubmitScanDto } from './dto/scan.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('scanner')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post('submit')
  async submitScan(@Body() dto: SubmitScanDto) {
    return this.scannerService.submitScan(dto);
  }

  @Get('stats/:examId')
  async getExamStats(
    @Param('examId') examId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.scannerService.getExamStats(examId, user.schoolId!);
  }
}
