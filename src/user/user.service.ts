import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async getAllUsers() {
    return this.prisma.user.findMany();
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
      include: { instance: true },
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
      if (error?.code === 'P2025' || error?.meta?.cause?.includes('Record to update not found')) {
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
      if (error?.code === 'P2025' || error?.meta?.cause?.includes('Record to delete does not exist')) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      throw error;
    }
  }
}
