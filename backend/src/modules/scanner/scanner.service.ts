import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitScanDto } from './dto/scan.dto';
import { EventsGateway } from '../../websocket/events.gateway';

interface AnswerKeyEntry {
  questionNumber: number;
  correctChoice: string;
}

interface GradeDetail {
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async submitScan(dto: SubmitScanDto) {
    const examVersion = await this.prisma.examVersion.findFirst({
      where: {
        examId: dto.examId,
        versionCode: dto.versionCode,
      },
      include: { exam: true },
    });

    if (!examVersion) {
      throw new NotFoundException('ไม่พบชุดข้อสอบ');
    }

    const student = await this.prisma.student.findFirst({
      where: {
        schoolId: dto.schoolId,
        studentCode: dto.studentCode,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new NotFoundException(`ไม่พบนักเรียนรหัส ${dto.studentCode}`);
    }

    const existingResult = await this.prisma.result.findFirst({
      where: { examId: dto.examId, studentId: student.id },
    });

    if (existingResult) {
      throw new BadRequestException('นักเรียนคนนี้ถูกตรวจแล้ว');
    }

    const answerSheet = await this.prisma.answerSheet.create({
      data: {
        schoolId: dto.schoolId,
        examId: dto.examId,
        examVersionId: examVersion.id,
        studentId: student.id,
        studentCode: dto.studentCode,
        answers: dto.answers as any,
        isProcessed: true,
        scannedAt: new Date(),
      },
    });

    const answerKey = examVersion.answerKey as unknown as AnswerKeyEntry[];
    let score = 0;
    const totalQuestions = answerKey.length;
    const details: GradeDetail[] = [];

    for (const key of answerKey) {
      const studentAnswer = dto.answers[String(key.questionNumber)] || null;
      const isCorrect = studentAnswer === key.correctChoice;
      if (isCorrect) score++;

      details.push({
        questionNumber: key.questionNumber,
        studentAnswer,
        correctAnswer: key.correctChoice,
        isCorrect,
      });
    }

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const result = await this.prisma.result.create({
      data: {
        schoolId: dto.schoolId,
        examId: dto.examId,
        examVersionId: examVersion.id,
        studentId: student.id,
        answerSheetId: answerSheet.id,
        score,
        totalQuestions,
        percentage: Math.round(percentage * 100) / 100,
        details: details as any,
      },
      include: {
        student: true,
        examVersion: true,
      },
    });

    this.logger.log(
      `ตรวจข้อสอบ: ${student.studentCode} - ${score}/${totalQuestions} (${percentage.toFixed(1)}%)`,
    );

    this.eventsGateway.emitToSchool(dto.schoolId, 'exam.scan.completed', {
      examId: dto.examId,
      studentCode: dto.studentCode,
      studentName: `${student.firstName} ${student.lastName}`,
      score,
      totalQuestions,
      percentage: Math.round(percentage * 100) / 100,
    });

    const stats = await this.getExamStats(dto.examId, dto.schoolId);
    this.eventsGateway.emitToSchool(dto.schoolId, 'exam.stats.updated', stats);

    return {
      result,
      answerSheet,
    };
  }

  async getExamStats(examId: string, schoolId: string) {
    const results = await this.prisma.result.findMany({
      where: { examId, schoolId },
      include: { student: true },
    });

    const totalScanned = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalScanned > 0 ? totalScore / totalScanned : 0;
    const averagePercentage =
      totalScanned > 0
        ? results.reduce((sum, r) => sum + r.percentage, 0) / totalScanned
        : 0;

    const maxScore = totalScanned > 0 ? Math.max(...results.map((r) => r.score)) : 0;
    const minScore = totalScanned > 0 ? Math.min(...results.map((r) => r.score)) : 0;

    const questionStats: Record<number, { correct: number; total: number }> = {};
    for (const result of results) {
      const details = result.details as unknown as GradeDetail[];
      if (Array.isArray(details)) {
        for (const d of details) {
          if (!questionStats[d.questionNumber]) {
            questionStats[d.questionNumber] = { correct: 0, total: 0 };
          }
          questionStats[d.questionNumber].total++;
          if (d.isCorrect) {
            questionStats[d.questionNumber].correct++;
          }
        }
      }
    }

    const questionAnalysis = Object.entries(questionStats)
      .map(([qNum, stat]) => ({
        questionNumber: Number(qNum),
        correctCount: stat.correct,
        totalCount: stat.total,
        correctRate: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
      }))
      .sort((a, b) => a.questionNumber - b.questionNumber);

    return {
      examId,
      totalScanned,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      maxScore,
      minScore,
      questionAnalysis,
      recentResults: results
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20)
        .map((r) => ({
          studentCode: r.student.studentCode,
          studentName: `${r.student.firstName} ${r.student.lastName}`,
          score: r.score,
          totalQuestions: r.totalQuestions,
          percentage: r.percentage,
          scannedAt: r.createdAt,
        })),
    };
  }
}
