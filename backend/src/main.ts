import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
    const configService = app.get(ConfigService);

    try {
      const helmet = await import('helmet');
      app.use(helmet.default());
    } catch {
      logger.warn('helmet ไม่สามารถโหลดได้ ข้ามไป');
    }

    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    // Hostinger uses PORT env var - prioritize it
    const port = process.env.PORT || configService.get<number>('app.port') || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`เซิร์ฟเวอร์เริ่มทำงานที่พอร์ต ${port}`);
    logger.log(`สภาพแวดล้อม: ${configService.get<string>('app.nodeEnv')}`);
  } catch (error) {
    console.error('FATAL: Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
