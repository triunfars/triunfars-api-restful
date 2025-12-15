import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private region: string;
  private s3: S3Client;
  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('S3_REGION') || 'us-east-2';
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, key: string) {
    const bucket = this.configService.get<string>('S3_BUCKET');
    const input: PutObjectCommandInput = {
      Body: file.buffer,
      Bucket: bucket,
      Key: key,
      ContentType: file.mimetype,
    };

    try {
      const response: PutObjectCommandOutput = await this.s3.send(
        new PutObjectCommand(input),
      );
      if (response.$metadata.httpStatusCode === 200) {
        return `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
      }
      throw new Error('File couldnt be uploaded');
    } catch (error) {
      console.log('AWS_UPLOAD_FILE_ERROR', error);
      throw error;
    }
  }

  async deleteFile(key: string) {
    const bucket = this.configService.get<string>('S3_BUCKET');
    const input = {
      Bucket: bucket,
      Key: key,
    };

    try {
      await this.s3.send(new DeleteObjectCommand(input));
      return true;
    } catch (error) {
      console.log('AWS_DELETE_FILE_ERROR', error);
      throw error;
    }
  }
}
