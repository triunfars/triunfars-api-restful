import { Test, TestingModule } from '@nestjs/testing';
import { SectionService } from './section.service';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../s3/s3.service';

const mockPrismaService = {
  course: {
    findUnique: jest.fn(),
  },
  section: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockS3Service = {
  uploadFile: jest.fn(),
};

describe('SectionService', () => {
  let service: SectionService;
  let prisma: typeof mockPrismaService;
  let s3: typeof mockS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionService,
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

    service = module.get<SectionService>(SectionService);
    prisma = module.get(PrismaService);
    s3 = module.get(S3Service);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addSectionImage', () => {
    it('should upload image with correct key structure', async () => {
      const courseSlug = 'test-course';
      const sectionSlug = 'test-section';
      const file = {
        originalname: 'image.png',
        fieldname: 'file',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;
      const mockUrl = 'https://s3.amazonaws.com/test-section-url';

      // Mock checkCourse
      prisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        slug: courseSlug,
      });
      s3.uploadFile.mockResolvedValue(mockUrl);
      prisma.section.update.mockResolvedValue({
        slug: sectionSlug,
        coverImage: mockUrl,
      });

      await service.addSectionImage(sectionSlug, courseSlug, file);

      expect(s3.uploadFile).toHaveBeenCalledWith(
        file,
        expect.stringMatching(
          new RegExp(
            `^${courseSlug}/sections/${sectionSlug}/coverImage/\\d+_file.png$`,
          ),
        ),
      );
    });
  });
});
