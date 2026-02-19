import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { Prisma } from '@prisma/client';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string, query: StudentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.classroom && { classroom: query.classroom }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' as const } },
          { lastName: { contains: query.search, mode: 'insensitive' as const } },
          { studentCode: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { studentCode: 'asc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('ไม่พบข้อมูลนักเรียน');
    }

    return student;
  }

  async create(schoolId: string, dto: CreateStudentDto) {
    const existing = await this.prisma.student.findFirst({
      where: { schoolId, studentCode: dto.studentCode, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('รหัสนักเรียนซ้ำ');
    }

    return this.prisma.student.create({
      data: { ...dto, schoolId },
    });
  }

  async update(id: string, schoolId: string, dto: UpdateStudentDto) {
    await this.findOne(id, schoolId);

    if (dto.studentCode) {
      const existing = await this.prisma.student.findFirst({
        where: {
          schoolId,
          studentCode: dto.studentCode,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ConflictException('รหัสนักเรียนซ้ำ');
      }
    }

    return this.prisma.student.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async importCsv(schoolId: string, fileBuffer: Buffer): Promise<{ imported: number; errors: string[] }> {
    const results: CreateStudentDto[] = [];
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer.toString());
      stream
        .pipe(csv())
        .on('data', (row: Record<string, string>) => {
          if (row.student_code && row.first_name && row.last_name && row.classroom) {
            results.push({
              studentCode: row.student_code.trim(),
              firstName: row.first_name.trim(),
              lastName: row.last_name.trim(),
              classroom: row.classroom.trim(),
            });
          } else {
            errors.push(`ข้อมูลไม่ครบ: ${JSON.stringify(row)}`);
          }
        })
        .on('end', async () => {
          let imported = 0;
          for (const student of results) {
            try {
              await this.prisma.student.upsert({
                where: {
                  schoolId_studentCode: {
                    schoolId,
                    studentCode: student.studentCode,
                  },
                },
                update: {
                  firstName: student.firstName,
                  lastName: student.lastName,
                  classroom: student.classroom,
                  deletedAt: null,
                },
                create: { ...student, schoolId },
              });
              imported++;
            } catch (err) {
              errors.push(`นำเข้าไม่สำเร็จ: ${student.studentCode} - ${err}`);
            }
          }
          this.logger.log(`นำเข้านักเรียน ${imported} คน สำหรับโรงเรียน ${schoolId}`);
          resolve({ imported, errors });
        })
        .on('error', (err: Error) => reject(err));
    });
  }

  async getClassrooms(schoolId: string): Promise<string[]> {
    const result = await this.prisma.student.findMany({
      where: { schoolId, deletedAt: null },
      select: { classroom: true },
      distinct: ['classroom'],
      orderBy: { classroom: 'asc' },
    });
    return result.map((r) => r.classroom);
  }
}
