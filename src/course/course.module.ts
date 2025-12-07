import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Module({
  providers: [CourseService, RolesGuard],
  controllers: [CourseController],
  exports: [CourseService],
})
export class CourseModule { }
