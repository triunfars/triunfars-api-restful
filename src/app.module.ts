import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { CourseModule } from './course/course.module';
import { LessonModule } from './course/section/lesson/lesson.module';
import { SectionModule } from './course/section/section.module';
import { ReviewModule } from './course/review/review.module';
import { S3Module } from './s3/s3.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    S3Module,
    CategoryModule,
    CourseModule,
    SectionModule,
    LessonModule,
    ReviewModule,
    PaymentModule,
    RouterModule.register([
      {
        path: '/courses',
        module: CourseModule,
        children: [
          {
            path: '/:courseSlug/sections',
            module: SectionModule,
            children: [
              {
                path: '/:sectionSlug/lessons',
                module: LessonModule,
              },
            ],
          },
          {
            path: '/:slug/reviews',
            module: ReviewModule,
          },
        ],
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
