import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { hasRoles } from '../auth/decorators';
import { JwtGuard, RolesGuard, IsActivatedGuard } from '../auth/guard';
import { UsersService } from './user.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('admin/users')
export class AdminController {
  constructor(private userService: UsersService) {}

  @hasRoles(Role.ADMIN)
  @Patch(':userId/activate')
  async activateUser(
    @Param('userId') userId: string,
    @Body('isActivated') isActivated: boolean,
  ) {
    return this.userService.activateUser(userId, isActivated);
  }

  @hasRoles(Role.ADMIN)
  @UseGuards(IsActivatedGuard)
  @Post(':userId/enroll')
  async enrollUser(
    @Param('userId') userId: string,
    @Body('courseId') courseId: string,
  ) {
    return this.userService.enrollUser(courseId, userId);
  }

  @hasRoles(Role.ADMIN)
  @UseGuards(IsActivatedGuard)
  @Delete(':userId/unenroll')
  async unenrollUser(
    @Param('userId') userId: string,
    @Body('courseId') courseId: string,
  ) {
    return this.userService.unenrollUser(courseId, userId);
  }
}
