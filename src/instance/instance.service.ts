import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInstanceDto, UpdateInstanceDto } from './dto';
import slugify from 'slugify';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class InstancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  getInstances() {
    try {
      return this.prisma.instance.findMany({
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          courses: {
            select: {
              title: true,
            },
          },
        },
      });
    } catch (error) {
      console.log('GET_INSTANCES ==>>', error);
      throw error;
    }
  }

  async getInstanceBySlug(slug: string) {
    try {
      const instance = await this.prisma.instance.findUnique({
        where: {
          slug,
        },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!instance) throw new ForbiddenException('Instance not found');

      return instance;
    } catch (error) {
      console.log('GET_INSTANCE_BY_SLUG ==>>', error);
      throw error;
    }
  }

  async getInstanceById(id: string) {
    try {
      const instance = await this.prisma.instance.findUnique({
        where: {
          id,
        },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!instance) throw new ForbiddenException('Instance not found');

      return instance;
    } catch (error) {
      console.log('GET_INSTANCE_BY_Id ==>>', error);
      throw error;
    }
  }

  async createInstance(dto: CreateInstanceDto) {
    try {
      const slug = slugify(dto.name);
      const newInstance = await this.prisma.instance.create({
        data: { ...dto, slug },
      });

      if (!newInstance)
        throw new ForbiddenException('Unexpected error, instance not created');

      return newInstance;
    } catch (error) {
      console.log('CREATE_INSTANCE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }
  async updateInstance(dto: UpdateInstanceDto, id: string) {
    try {
      const slug = slugify(dto.name);
      const instanceUpdated = await this.prisma.instance.update({
        where: { id },
        data: { ...dto, slug },
      });

      if (!instanceUpdated)
        throw new ForbiddenException('Unexpected error, instance not updated');

      return instanceUpdated;
    } catch (error) {
      console.log('UPDATE_INSTANCE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async updateInstanceImage(id: string, file: Express.Multer.File) {
    try {
      // Constructing key and saving image in AWS
      const key = `${file.fieldname}${Date.now()}`;
      const imageUrl = await this.s3Service.uploadFile(file, key);

      // Updating db
      const instanceUpdated = await this.prisma.instance.update({
        where: {
          id,
        },
        data: { logo: imageUrl },
      });

      if (!instanceUpdated)
        throw new ForbiddenException('Unexpected error, instance not updated');

      return instanceUpdated;
    } catch (error) {
      console.log('ADD_INSTANCE_IMAGE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }

  async deleteInstance(id: string) {
    try {
      const instanceDeleted = await this.prisma.instance.delete({
        where: { id },
      });

      if (!instanceDeleted)
        throw new ForbiddenException('Unexpected error, instance not deleted');

      return {
        success: true,
        instance: instanceDeleted,
      };
    } catch (error) {
      console.log('DELETE_INSTANCE ==>>', error);
      throw new ForbiddenException('Server Internal Error');
    }
  }
}
