import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { CourseModule } from '../course/course.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [CourseModule],
  providers: [UsersService],
  controllers: [UsersController, AdminController],
})
export class UsersModule {}
