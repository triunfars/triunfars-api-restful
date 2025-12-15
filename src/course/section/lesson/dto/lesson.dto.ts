import { LessonType } from '@prisma/client';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  source: string;

  @IsOptional()
  type: LessonType;

  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  @IsOptional()
  coverImage: string;
}
