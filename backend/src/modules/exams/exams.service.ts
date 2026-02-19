import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto, GenerateVersionsDto } from './dto/exam.dto';
import { ExamStatus } from '@prisma/client';

interface QuestionMapping {
  originalNumber: number;
  newNumber: number;
}

interface ChoiceMapping {
  questionNumber: number;
  originalLabel: string;
  newLabel: string;
}

interface AnswerKeyEntry {
  questionNumber: number;
  correctChoice: string;
}

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { schoolId, deletedAt: null };

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { questions: true, examVersions: true, results: true } },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, schoolId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
          include: { choices: true },
        },
        examVersions: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('ไม่พบข้อสอบ');
    }

    return exam;
  }

  async create(schoolId: string, dto: CreateExamDto) {
    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          schoolId,
          title: dto.title,
          description: dto.description,
          subject: dto.subject,
          totalQuestions: dto.totalQuestions,
          choicesPerQuestion: dto.choicesPerQuestion || 4,
        },
      });

      if (dto.questions && dto.questions.length > 0) {
        for (const q of dto.questions) {
          await tx.question.create({
            data: {
              examId: exam.id,
              questionNumber: q.questionNumber,
              content: q.content,
              choices: {
                create: q.choices.map((c) => ({
                  label: c.label,
                  content: c.content,
                  isCorrect: c.isCorrect,
                })),
              },
            },
          });
        }
      }

      this.logger.log(`สร้างข้อสอบ: ${exam.title} (${exam.id})`);
      return exam;
    });
  }

  async update(id: string, schoolId: string, dto: UpdateExamDto) {
    await this.findOne(id, schoolId);
    return this.prisma.exam.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.subject && { subject: dto.subject }),
        ...(dto.status && { status: dto.status as ExamStatus }),
      },
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.exam.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async generateVersions(examId: string, schoolId: string, dto: GenerateVersionsDto) {
    const exam = await this.findOne(examId, schoolId);

    if (exam.questions.length === 0) {
      throw new BadRequestException('ข้อสอบยังไม่มีคำถาม');
    }

    const versions = [];

    for (const versionCode of dto.versionCodes) {
      const questions = [...exam.questions];

      let questionOrder = questions.map((q, i) => i);
      if (dto.shuffleQuestions) {
        questionOrder = this.shuffleArray(questionOrder);
      }

      const questionMapping: QuestionMapping[] = [];
      const choiceMapping: ChoiceMapping[] = [];
      const answerKey: AnswerKeyEntry[] = [];

      const choiceLabels = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, exam.choicesPerQuestion);

      for (let newIdx = 0; newIdx < questionOrder.length; newIdx++) {
        const origIdx = questionOrder[newIdx];
        const question = questions[origIdx];

        questionMapping.push({
          originalNumber: question.questionNumber,
          newNumber: newIdx + 1,
        });

        let choiceOrder = question.choices.map((_, i) => i);
        if (dto.shuffleChoices) {
          choiceOrder = this.shuffleArray(choiceOrder);
        }

        for (let ci = 0; ci < choiceOrder.length; ci++) {
          const origChoice = question.choices[choiceOrder[ci]];
          choiceMapping.push({
            questionNumber: newIdx + 1,
            originalLabel: origChoice.label,
            newLabel: choiceLabels[ci],
          });

          if (origChoice.isCorrect) {
            answerKey.push({
              questionNumber: newIdx + 1,
              correctChoice: choiceLabels[ci],
            });
          }
        }
      }

      const version = await this.prisma.examVersion.upsert({
        where: {
          examId_versionCode: { examId, versionCode },
        },
        update: {
          questionMapping: questionMapping as any,
          choiceMapping: choiceMapping as any,
          answerKey: answerKey as any,
        },
        create: {
          examId,
          versionCode,
          questionMapping: questionMapping as any,
          choiceMapping: choiceMapping as any,
          answerKey: answerKey as any,
        },
      });

      versions.push(version);
    }

    await this.prisma.exam.update({
      where: { id: examId },
      data: { status: 'PUBLISHED' },
    });

    this.logger.log(`สร้างชุดข้อสอบ ${dto.versionCodes.join(',')} สำหรับ ${examId}`);
    return versions;
  }

  async getExamVersions(examId: string, schoolId: string) {
    await this.findOne(examId, schoolId);
    return this.prisma.examVersion.findMany({
      where: { examId },
      orderBy: { versionCode: 'asc' },
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
