import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from './course.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateCourseDto } from './dto';

const mockPrismaService = {
  category: {
    findUnique: jest.fn(),
  },
  course: {
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockS3Service = {
  uploadFile: jest.fn(),
};

describe('CourseService', () => {
  let service: CourseService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCourse', () => {
    it('should create a course', async () => {
      const dto: CreateCourseDto = {
        title: 'Test Course',
        description: 'Description',
        instructorId: 'inst-1',
        categoryId: 'cat-1',
        price: '10',
      };

      // Mock category check
      prisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      // Mock create return
      prisma.course.create.mockResolvedValue({ id: 'course-1', ...dto });

      await service.createCourse(dto);

      expect(prisma.course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test Course',
          }),
        }),
      );
    });
  });

  describe('updateCourse', () => {
    it('should update a course', async () => {
      const dto: any = {
        title: 'Updated Course',
      };
      const courseId = 'course-1';

      prisma.course.update.mockResolvedValue({ id: courseId, ...dto });

      await service.updateCourse(dto, courseId);

      expect(prisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: courseId },
          data: expect.objectContaining({
            title: 'Updated Course',
          }),
        }),
      );
    });
  });
  describe('updateCourseImage', () => {
    it('should upload image with correct key structure', async () => {
      const courseSlug = 'test-course';
      const file = {
        originalname: 'image.png',
        fieldname: 'file',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;
      const mockUrl = 'https://s3.amazonaws.com/test-url';

      (mockS3Service.uploadFile as jest.Mock).mockResolvedValue(mockUrl);
      (prisma.course.update as jest.Mock).mockResolvedValue({
        slug: courseSlug,
        coverImage: mockUrl,
      });

      await service.updateCourseImage(courseSlug, file);

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        file,
        expect.stringMatching(
          new RegExp(`^${courseSlug}/coverImage/\\d+_file.png$`),
        ),
      );
      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { slug: courseSlug },
        data: { coverImage: mockUrl },
      });
    });
  });
});
