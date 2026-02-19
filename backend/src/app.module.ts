import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { appConfig, jwtConfig, redisConfig } from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './websocket/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { StudentsModule } from './modules/students/students.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ScannerModule } from './modules/scanner/scanner.module';
import { ResultsModule } from './modules/results/results.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    EventsModule,
    AuthModule,
    SchoolsModule,
    StudentsModule,
    ExamsModule,
    ScannerModule,
    ResultsModule,
  ],
})
export class AppModule {}
