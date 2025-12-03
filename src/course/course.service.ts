import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import slugify from 'slugify';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) { }

  async getAll() {
    try {
      return await this.prisma.course.findMany({
        include: {
          category: true,
          instructor: true,
          sections: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              lessons: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  description: true,
                  content: true,
                  url: true,
                  coverImage: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.log('GET_ALL_COURSES ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async getBySlug(slug: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { slug },
        include: {
          category: true,
          instructor: true,
          sections: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              lessons: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  description: true,
                  content: true,
                  url: true,
                  coverImage: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!course) throw new ForbiddenException('Course not found');

      return course;
    } catch (error) {
      console.log('GET_COURSE_BY_SLUG ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async createCourse(dto: CreateCourseDto) {
    try {
      // Check the category and check if exists
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) throw new ForbiddenException('Category does not exists');

      // Create course
      const slug = slugify(dto.title);
      const newCourse = await this.prisma.course.create({
        data: {
          ...dto,
          slug,
        },
      });

      if (!newCourse)
        throw new ForbiddenException('Unexpected error, course not created');

      return newCourse;
    } catch (error) {
      console.log('CREATE_COURSE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async updateCourse(dto: UpdateCourseDto, id: string) {
    try {
      const slug = slugify(dto.title);
      const updatedCourse = await this.prisma.course.update({
        where: { id },
        data: { ...dto, slug },
      });

      if (!updatedCourse)
        throw new ForbiddenException('Unexpected error, course not updated');

      return updatedCourse;
    } catch (error) {
      console.log('UPDATE_COURSE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async updateCourseImage(courseSlug: string, file: Express.Multer.File) {
    try {
      // Constructing key and saving image in AWS
      const key = `${file.fieldname}${Date.now()}`;
      const imageUrl = await this.s3Service.uploadFile(file, key);

      const courseUpdated = await this.prisma.course.update({
        where: {
          slug: courseSlug,
        },
        data: { coverImage: imageUrl },
      });

      if (!courseUpdated) {
        throw new ForbiddenException('Course not updaded, please check logs');
      }

      return courseUpdated;
    } catch (error) {
      console.log('ADD_INSTANCE_IMAGE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async deleteCourse(id: string) {
    try {
      const deletedCourse = await this.prisma.course.delete({
        where: { id },
      });
      if (!deletedCourse)
        throw new ForbiddenException('Unexpected error, course not deleted');
      return {
        deleted: true,
        id: deletedCourse.id,
      };
    } catch (error) {
      console.log('UPDATE_COURSE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async enrollUser(courseId: string, userId: string) {
    try {
      const course = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          students: {
            connect: { id: userId },
          },
        },
      });
      return course;
    } catch (error) {
      console.log('ENROLL_USER ==>>', error);
      if (error.code === 'P2025') {
        throw new ForbiddenException('Course not found');
      }
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async unenrollUser(courseId: string, userId: string) {
    try {
      const course = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          students: {
            disconnect: { id: userId },
          },
        },
      });
      return course;
    } catch (error) {
      console.log('UNENROLL_USER ==>>', error);
      if (error.code === 'P2025') {
        throw new ForbiddenException('Course not found');
      }
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async getEnrolledCourses(userId: string) {
    try {
      return await this.prisma.course.findMany({
        where: {
          studentIds: {
            has: userId,
          },
        },
        include: {
          category: true,
          instructor: true,
        },
      });
    } catch (error) {
      console.log('GET_ENROLLED_COURSES ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async getEnrolledUsers(courseId: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          students: true,
        },
      });

      if (!course) throw new ForbiddenException('Course not found');

      return course.students;
    } catch (error) {
      console.log('GET_ENROLLED_USERS ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }
}
