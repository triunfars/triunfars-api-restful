import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSectionDto } from './dto';
import slugify from 'slugify';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class SectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) { }

  private async checkCourse(slug: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!course) throw new ForbiddenException('Course does not exist');

      return course;
    } catch (error) {
      console.log('COURSE_CHECK_SECTION ==>>', error);
      throw new ForbiddenException('Server internal error');
    }
  }

  async getAll(slug: string) {
    try {
      const course = await this.checkCourse(slug);
      return this.prisma.section.findMany({
        where: { courseId: course.id },
        include: { course: true },
      });
    } catch (error) {
      console.log('GET_ALL_SECTIONS_BY_COURSE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async getBySlug(courseSlug: string, sectionSlug: string) {
    try {
      const course = await this.checkCourse(courseSlug);

      const section = await this.prisma.section.findUnique({
        where: {
          courseId: course.id,
          slug: sectionSlug,
        },
        include: { course: true },
      });
      if (!section) throw new ForbiddenException('Section not found');

      return section;
    } catch (error) {
      console.log('GET_SECTION_BY_SLUG ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async createSection(courseSlug: string, dto: CreateSectionDto) {
    try {
      const course = await this.checkCourse(courseSlug);

      const sectionSlug = slugify(dto.title, { lower: true });
      const newSection = await this.prisma.section.create({
        data: {
          ...dto,
          courseId: course.id,
          slug: sectionSlug,
        },
      });
      if (!newSection)
        throw new ForbiddenException('Unexpected error, section not created');

      return newSection;
    } catch (error) {
      console.log('CREATE_COURSE_SECTION ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async addSectionImage(
    sectionSlug: string,
    courseSlug: string,
    file: Express.Multer.File,
  ) {
    try {
      const course = await this.checkCourse(courseSlug);

      // Constructing key and saving image in AWS
      const fileExtension = file.originalname.split('.').pop();
      const key = `${courseSlug}/sections/${sectionSlug}/coverImage/${Date.now()}_${file.fieldname}.${fileExtension}`;
      const imageUrl = await this.s3Service.uploadFile(file, key);

      const updatedSection = await this.prisma.section.update({
        where: {
          courseId: course.id,
          slug: sectionSlug,
        },
        data: { coverImage: imageUrl },
      });

      return updatedSection;
    } catch (error) {
      console.log('ADD_SECTION_IMAGE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async updateSection(
    courseSlug: string,
    sectionSlug: string,
    dto: CreateSectionDto,
  ) {
    try {
      const course = await this.checkCourse(courseSlug);
      const slug = slugify(dto.title, { lower: true });
      const updatedSection = await this.prisma.section.update({
        where: {
          courseId: course.id,
          slug: sectionSlug,
        },
        data: { ...dto, slug },
      });

      if (!updatedSection)
        throw new ForbiddenException('unexpected error, section not updated');

      return updatedSection;
    } catch (error) {
      console.log('UPDATE_SECTION_ERROR ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async deleteSection(courseSlug: string, sectionSlug: string) {
    try {
      const course = await this.checkCourse(courseSlug);
      const deletedSection = await this.prisma.section.delete({
        where: {
          slug: sectionSlug,
          courseId: course.id,
        },
      });
      if (!deletedSection)
        throw new ForbiddenException('Unexpected error, section not deleted');
      return {
        success: true,
        deletedData: deletedSection,
      };
    } catch (error) {
      console.log('DELETE_SECTION_ERROR ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }
}
