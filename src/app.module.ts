import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { CourseModule } from './course/course.module';
import { LessonModule } from './course/section/lesson/lesson.module';
import { SectionModule } from './course/section/section.module';
import { ReviewModule } from './course/review/review.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    S3Module,
    CategoryModule,
    CourseModule,
    SectionModule,
    LessonModule,
    ReviewModule,
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
})
export class AppModule { }
