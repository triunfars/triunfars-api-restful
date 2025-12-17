import { IsActivatedGuard } from './is-activated.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('IsActivatedGuard', () => {
  let guard: IsActivatedGuard;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsActivatedGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<IsActivatedGuard>(IsActivatedGuard);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no userId in params', async () => {
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      params: {},
    });

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should throw NotFoundException if user is not found', async () => {
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      params: { userId: 'non-existent-id' },
    });
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-id' },
    });
  });

  it('should throw ForbiddenException if user is not activated', async () => {
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      params: { userId: 'inactive-user-id' },
    });
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      id: 'inactive-user-id',
      isActivated: false,
    } as any);

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return true if user is activated', async () => {
    (
      mockExecutionContext.switchToHttp().getRequest as jest.Mock
    ).mockReturnValue({
      params: { userId: 'active-user-id' },
    });
    jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      id: 'active-user-id',
      isActivated: true,
    } as any);

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });
});
