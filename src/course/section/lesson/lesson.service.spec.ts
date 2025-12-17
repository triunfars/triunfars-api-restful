import { Test, TestingModule } from '@nestjs/testing';
import { LessonService } from './lesson.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3Service } from '../../../s3/s3.service';

const mockPrismaService = {
  section: {
    findUnique: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockS3Service = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

describe('LessonService', () => {
  let service: LessonService;
  let prisma: typeof mockPrismaService;
  let s3: typeof mockS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
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

    service = module.get<LessonService>(LessonService);
    prisma = module.get(PrismaService);
    s3 = module.get(S3Service);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addLessonImage', () => {
    it('should upload image with correct key structure', async () => {
      const courseSlug = 'test-course';
      const sectionSlug = 'test-section';
      const lessonSlug = 'test-lesson';
      const lessonId = 'lesson-1';
      const file = {
        originalname: 'image.png',
        fieldname: 'file',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;
      const mockUrl = 'https://s3.amazonaws.com/test-lesson-image';

      // Mock checkSection
      prisma.section.findUnique.mockResolvedValue({
        id: 'section-1',
        courseId: 'course-1',
      });
      // Mock lesson find (to get slug)
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        slug: lessonSlug,
      });
      s3.uploadFile.mockResolvedValue(mockUrl);
      prisma.lesson.update.mockResolvedValue({
        id: lessonId,
        coverImage: mockUrl,
      });

      await service.addLessonImage(file, lessonId, sectionSlug, courseSlug);

      expect(s3.uploadFile).toHaveBeenCalledWith(
        file,
        expect.stringMatching(
          new RegExp(
            `^${courseSlug}/sections/${sectionSlug}/lessons/${lessonSlug}/coverImage/\\d+_file.png$`,
          ),
        ),
      );
    });
  });

  describe('addLessonVideo', () => {
    it('should upload video with correct key structure and NOT delete if no previous source', async () => {
      const courseSlug = 'test-course';
      const sectionSlug = 'test-section';
      const lessonSlug = 'test-lesson';
      const lessonId = 'lesson-1';
      const file = {
        originalname: 'video.mp4',
        fieldname: 'file',
        buffer: Buffer.from('test-video'),
      } as Express.Multer.File;
      const mockUrl = 'https://s3.amazonaws.com/test-lesson-video';

      // Mock checkSection
      prisma.section.findUnique.mockResolvedValue({
        id: 'section-1',
        courseId: 'course-1',
      });
      // Mock lesson find (to get slug)
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        slug: lessonSlug,
        source: null,
      });
      s3.uploadFile.mockResolvedValue(mockUrl);
      prisma.lesson.update.mockResolvedValue({
        id: lessonId,
        source: mockUrl,
      } as any);

      await service.addLessonVideo(file, lessonId, sectionSlug, courseSlug);

      expect(s3.uploadFile).toHaveBeenCalledWith(
        file,
        expect.stringMatching(
          new RegExp(
            `^${courseSlug}/sections/${sectionSlug}/lessons/${lessonSlug}/video/\\d+_file.mp4$`,
          ),
        ),
      );
      expect(s3.deleteFile).not.toHaveBeenCalled();
    });

    it('should delete old video file if it exists', async () => {
      const courseSlug = 'test-course';
      const sectionSlug = 'test-section';
      const lessonSlug = 'test-lesson';
      const lessonId = 'lesson-1';
      const file = {
        originalname: 'new-video.mp4',
        fieldname: 'file',
        buffer: Buffer.from('new-test-video'),
      } as Express.Multer.File;
      const newMockUrl = 'https://s3.amazonaws.com/new-lesson-video';
      const oldKey = 'old-video-key.mp4';
      const oldSource = `https://triunfars-bucket.s3.us-east-2.amazonaws.com/${oldKey}`;

      // Mock checkSection
      prisma.section.findUnique.mockResolvedValue({
        id: 'section-1',
        courseId: 'course-1',
      });

      // Mock lesson find with existing source
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        slug: lessonSlug,
        source: oldSource,
      });

      s3.deleteFile.mockResolvedValue(true);
      s3.uploadFile.mockResolvedValue(newMockUrl);
      prisma.lesson.update.mockResolvedValue({
        id: lessonId,
        source: newMockUrl,
      } as any);

      await service.addLessonVideo(file, lessonId, sectionSlug, courseSlug);

      expect(s3.deleteFile).toHaveBeenCalledWith(oldKey);
      expect(s3.uploadFile).toHaveBeenCalled();
    });
  });
});
