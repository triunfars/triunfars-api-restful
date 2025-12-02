import { IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  instructorId: string;

  @IsString()
  categoryId: string;

  @IsString()
  price: string;
}

export interface UpdateCourseDto {
  title: string;
  description: string;
  instructorId: string;
  categoryId: string;
  price: string;
}
