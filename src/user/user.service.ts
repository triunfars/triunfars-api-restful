import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto';
import { User } from '@prisma/client';
import { CourseService } from 'src/course/course.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
  ) {}

  async getAllUsers() {
    try {
      return this.prisma.user.findMany({
        include: {
          enrolledCourses: true,
        },
      });
    } catch (error) {
      console.log('GET_ALL_USERS ==>>', error);
      throw new ForbiddenException('Internal error');
    }
  }

  async getMyPrivileges(user: User) {
    try {
      const role = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          role: true,
        },
      });
      return role;
    } catch (error) {
      console.log('GET_MY_PRIVILEGES ==>>', error);
      throw new ForbiddenException('Internal error');
    }
  }

  async getMe(user: User) {
    const me = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        instance: true,
        enrolledCourses: {
          include: {
            instructor: true,
            category: true,
          },
        },
      },
    });
    if (!me) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }
    return me;
  }

  async editMe(user: User) {
    try {
      // TODO
      // Check if session is still valid
      // If yes continue, otherwise stop execution.
      // const userUpdated =
      //   await this.prisma.user.update({
      //     where: { id: user.id },
      //     data: { ...dto },
      //   });

      // if (!userUpdated)
      //   throw new ForbiddenException(
      //     'Unexpected error, user not updated',
      //   );

      return user;
    } catch (error) {
      console.log('EDIT_ME ==>>', error);
      throw new ForbiddenException('Internal error');
    }
  }

  // TODO: check we don't update the user current logged in
  async updateUser(dto: UpdateUserDto, id: string) {
    try {
      const userUpdated = await this.prisma.user.update({
        where: { id },
        data: { ...dto },
      });
      return userUpdated;
    } catch (error) {
      if (
        error?.code === 'P2025' ||
        error?.meta?.cause?.includes('Record to update not found')
      ) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const user = await this.prisma.user.delete({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      if (
        error?.code === 'P2025' ||
        error?.meta?.cause?.includes('Record to delete does not exist')
      ) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw error;
    }
  }

  async activateUser(userId: string, isActivated: boolean) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { isActivated },
      });
    } catch (error) {
      if (error?.code === 'P2025') {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw error;
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
        include: {
          instructor: true,
          category: true,
        },
      });
      this.logger.log(`User ${userId} enrolled in course ${courseId}`);
      return course;
    } catch (error) {
      console.log('Error ==>>', error);
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
        include: {
          instructor: true,
          category: true,
        },
      });
      return course;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ForbiddenException('Course not found');
      }
      throw new ForbiddenException('Server Internal Error');
    }
  }
}
