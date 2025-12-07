import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { JwtGuard } from 'src/auth/guard';
import { CreateLessonDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import { User } from '@prisma/client';

import { CourseAccessGuard, RolesGuard } from 'src/auth/guard';
import { hasRoles } from 'src/auth/decorators/roles.decorators';
import { Role } from '@prisma/client';

@UseGuards(JwtGuard, CourseAccessGuard)
@Controller()
export class LessonController {
  constructor(private readonly lessonService: LessonService) { }

  @Get()
  getAll(
    @Param('sectionSlug') sectionSlug: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.lessonService.getAll(sectionSlug, courseSlug);
  }

  @Get(':lessonId')
  getById(
    @Param('lessonId') lessonId: string,
    @Param('sectionSlug') sectionSlug: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.lessonService.getById(sectionSlug, lessonId, courseSlug);
  }

  @UseGuards(RolesGuard)
  @hasRoles(Role.ADMIN, Role.INSTRUCTOR)
  @Post()
  createLesson(
    @Body() dto: CreateLessonDto,
    @Param('sectionSlug') sectionSlug: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.lessonService.createLesson(sectionSlug, dto, courseSlug);
  }

  @UseGuards(RolesGuard)
  @hasRoles(Role.ADMIN, Role.INSTRUCTOR)
  @Patch(':lessonId')
  updateLesson(
    @Body() dto: Partial<CreateLessonDto>,
    @Param('lessonId') lessonId: string,
    @Param('sectionSlug') sectionSlug: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.lessonService.updateLesson(dto, lessonId, sectionSlug, courseSlug);
  }

  @UseGuards(RolesGuard)
  @hasRoles(Role.ADMIN, Role.INSTRUCTOR)
  @Patch(':lessonId/uploadimage')
  @UseInterceptors(FileInterceptor('file'))
  addSectionImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('sectionSlug') sectionSlug: string,
    @Param('lessonId') lessonId: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.lessonService.addLessonImage(file, lessonId, sectionSlug, courseSlug);
  }

  @Patch(':lessonId/complete')
  markAsCompleted(
    @Param('lessonId') lessonId: string,
    @GetMe() user: User,
  ) {
    return this.lessonService.markLessonAsCompleted(lessonId, user.id);
  }

  @UseGuards(RolesGuard)
  @hasRoles(Role.ADMIN, Role.INSTRUCTOR)
  @Delete(':lessonId')
  deleteLesson(
    @Param('lessonId') lessonId: string,
    @Param('sectionSlug') sectionSlug: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    return this.lessonService.deleteLesson(lessonId, sectionSlug, courseSlug);
  }
}
