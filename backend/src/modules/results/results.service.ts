import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByExam(examId: string, schoolId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { examId, schoolId };

    const [results, total] = await Promise.all([
      this.prisma.result.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: true,
          examVersion: { select: { versionCode: true } },
        },
      }),
      this.prisma.result.count({ where }),
    ]);

    return {
      data: results,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByStudent(studentId: string, schoolId: string) {
    return this.prisma.result.findMany({
      where: { studentId, schoolId },
      include: {
        exam: { select: { title: true, subject: true } },
        examVersion: { select: { versionCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, schoolId: string) {
    const result = await this.prisma.result.findFirst({
      where: { id, schoolId },
      include: {
        student: true,
        exam: true,
        examVersion: true,
        answerSheet: true,
      },
    });

    if (!result) {
      throw new NotFoundException('ไม่พบผลสอบ');
    }

    return result;
  }

  async exportExamResults(examId: string, schoolId: string) {
    const results = await this.prisma.result.findMany({
      where: { examId, schoolId },
      include: {
        student: true,
        examVersion: { select: { versionCode: true } },
      },
      orderBy: { student: { studentCode: 'asc' } },
    });

    return results.map((r) => ({
      รหัสนักเรียน: r.student.studentCode,
      ชื่อ: r.student.firstName,
      นามสกุล: r.student.lastName,
      ห้องเรียน: r.student.classroom,
      ชุดข้อสอบ: r.examVersion.versionCode,
      คะแนน: r.score,
      คะแนนเต็ม: r.totalQuestions,
      เปอร์เซ็นต์: r.percentage,
    }));
  }
}
