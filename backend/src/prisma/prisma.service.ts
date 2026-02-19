import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('เชื่อมต่อฐานข้อมูลสำเร็จ');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('ตัดการเชื่อมต่อฐานข้อมูล');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    const models = Reflect.ownKeys(this).filter((key) => {
      const k = String(key);
      return k[0] !== '_' && k[0] !== '$';
    });
    return Promise.all(
      models.map((modelKey) => {
        const model = (this as any)[modelKey];
        if (model?.deleteMany) return model.deleteMany();
        return null;
      }),
    );
  }
}
