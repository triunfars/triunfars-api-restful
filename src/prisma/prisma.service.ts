import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDb() {
    if (process.env.NODE_ENV === 'production') return;

    // Delete in order to respect dependencies (though MongoDB is flexible, this is safer)
    await this.lessonProgress.deleteMany();
    await this.review.deleteMany();
    await this.lesson.deleteMany();
    await this.section.deleteMany();
    await this.course.deleteMany();
    await this.category.deleteMany();
    await this.user.deleteMany();
    await this.instance.deleteMany();
  }
}
