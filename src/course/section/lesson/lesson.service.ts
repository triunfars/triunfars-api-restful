import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLessonDto } from './dto';
import slugify from 'slugify';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) { }

  // chequear la forma de tambien chequear el curso si existe sin tener que pasar el courseId por todos lados
  private async checkSection(sectionSlug: string) {
    try {
      // const course =
      //   await this.prisma.course.findUnique({
      //     where: { id: courseId },
      //   });

      // if (!course)
      //   throw new ForbiddenException(
      //     'Course does not exist',
      //   );
      const section = await this.prisma.section.findUnique({
        where: { slug: sectionSlug },
      });

      if (!section) throw new ForbiddenException('Section does not exist');
      return section;
    } catch (error) {
      console.log('CHECK_SECTION_ERROR ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }

  async getAll(sectionSlug: string) {
    const section = await this.checkSection(sectionSlug);
    return this.prisma.lesson.findMany({
      where: { sectionId: section.id },
      include: {
        section: {
          select: {
            slug: true,
            course: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async getById(sectionSlug: string, lessonId: string) {
    try {
      const section = await this.checkSection(sectionSlug);
      const lesson = await this.prisma.lesson.findUnique({
        where: {
          sectionId: section.id,
          id: lessonId,
        },
        include: {
          section: {
            select: {
              slug: true,
              course: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!lesson) throw new ForbiddenException('Lesson not found');

      return lesson;
    } catch (error) {
      console.log('LESSON_BY_ID_ERROR ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }

  async createLesson(sectionSlug: string, dto: CreateLessonDto) {
    try {
      const section = await this.checkSection(sectionSlug);
      const slug = slugify(dto.title);
      return await this.prisma.lesson.create({
        data: { ...dto, sectionId: section.id, slug },
      });
    } catch (error) {
      console.log('CREATE_LESSON_ERROR ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }

  async updateLesson(
    dto: Partial<CreateLessonDto>,
    lessonId: string,
    sectionSlug: string,
  ) {
    try {
      const section = await this.checkSection(sectionSlug);
      const slug = slugify(dto.title);
      return await this.prisma.lesson.update({
        where: { id: lessonId, sectionId: section.id },
        data: { ...dto, slug },
      });
    } catch (error) {
      console.log('UPDATE_LESSON_ERROR ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }

  async addLessonImage(
    file: Express.Multer.File,
    lessonId: string,
    sectionSlug: string,
  ) {
    try {
      const section = await this.checkSection(sectionSlug);

      // Constructing key and saving image in AWS
      const key = `${file.fieldname}${Date.now()}`;
      const imageUrl = await this.s3Service.uploadFile(file, key);
      return await this.prisma.lesson.update({
        where: {
          id: lessonId,
          sectionId: section.id,
        },
        data: { coverImage: imageUrl },
      });
    } catch (error) {
      console.log('ADD_LESSON_IMAGE_ERROR ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }

  async markLessonAsCompleted(lessonId: string, userId: string) {
    try {
      const lessonProgress = await this.prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: userId,
            lessonId: lessonId,
          },
        },
        update: {
          isCompleted: true,
        },
        create: {
          userId: userId,
          lessonId: lessonId,
          isCompleted: true,
        },
      });

      return lessonProgress;
    } catch (error) {
      console.log('MARK_LESSON_AS_COMPLETED_ERROR ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }

  async deleteLesson(lessonId: string, sectionId: string) {
    try {
      await this.checkSection(sectionId);

      const deletedLesson = await this.prisma.lesson.delete({
        where: { id: lessonId, sectionId },
      });

      return {
        success: true,
        deletedData: deletedLesson,
      };
    } catch (error) {
      console.log('DELETE_LESSON_ERROR ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }
}
