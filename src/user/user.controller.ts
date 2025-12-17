import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import { JwtGuard } from 'src/auth/guard';
import { UsersService } from './user.service';
import { EditMeDto } from './dto';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { hasRoles } from 'src/auth/decorators/roles.decorators';

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/me/privileges')
  getMyPrivileges(@GetMe() user: User) {
    return this.usersService.getMyPrivileges(user);
  }

  @Get('/me')
  getMe(@GetMe() user: User) {
    return this.usersService.getMe(user);
  }

  @Patch('/me')
  editMe(@GetMe() user: User, dto: EditMeDto) {
    console.log(dto);
    return this.usersService.editMe(user);
  }

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(RolesGuard)
  @hasRoles(Role.ADMIN)
  @Put('/:id')
  updateUser(@Body() dto: User, @Param('id') id: string) {
    return this.usersService.updateUser(dto, id);
  }

  @UseGuards(RolesGuard)
  @hasRoles(Role.ADMIN)
  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
