import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { UsersService } from './user.service';
import { CourseService } from '../course/course.service';

describe('AdminController', () => {
  let controller: AdminController;
  let usersService: UsersService;

  const mockUsersService = {
    activateUser: jest.fn(),
  };

  const mockCourseService = {
    enrollUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: CourseService,
          useValue: mockCourseService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('activateUser', () => {
    it('should call usersService.activateUser', async () => {
      const userId = '1';
      const isActivated = true;

      await controller.activateUser(userId, isActivated);

      expect(usersService.activateUser).toHaveBeenCalledWith(
        userId,
        isActivated,
      );
    });
  });

  describe('enrollUser', () => {
    it('should call usersService.enrollUser with correct parameter order', async () => {
      const userId = '1';
      const courseId = 'course1';

      await controller.enrollUser(userId, courseId);

      // Expect usersService.enrollUser(courseId, userId)
      expect(usersService.enrollUser).toHaveBeenCalledWith(courseId, userId);
    });
  });
});
