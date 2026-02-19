import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.school.count({ where }),
    ]);

    return { data: schools, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findFirst({ where: { id, deletedAt: null } });
    if (!school) throw new NotFoundException('ไม่พบโรงเรียน');
    return school;
  }

  async create(data: { name: string; code: string; address?: string; phone?: string }) {
    const existing = await this.prisma.school.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException('รหัสโรงเรียนซ้ำ');
    const school = await this.prisma.school.create({ data });
    this.logger.log(`สร้างโรงเรียน: ${school.name}`);
    return school;
  }

  async update(id: string, data: { name?: string; address?: string; phone?: string }) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
