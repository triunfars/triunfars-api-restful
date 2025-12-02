import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto, SignInDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  async signup(dto: SignUpDto) {
    try {
      // Hash the password
      const hashPassword = await argon.hash(dto.password);
      // TODO: upload image
      const newUser = await this.prisma.user.create({
        data: {
          ...dto,
          password: hashPassword,
        },
      });

      if (!newUser)
        throw new ForbiddenException('Error while creating the user');

      return this.registerToken(newUser.id, newUser.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ForbiddenException('Credentials Taken');
      }
      console.log('SIGN_UP_ERROR ==>>', error);
      throw error;
    }
  }

  async signin(dto: SignInDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!user) throw new ForbiddenException('Credentials incorrect');

      const pwMatches = await argon.verify(user.password, dto.password);

      if (!pwMatches) throw new ForbiddenException('Password incorrect');

      return this.registerToken(user.id, user.email);
    } catch (error) {
      console.log('SIGN_IN_ERROR ==>>', error);
      throw error;
    }
  }

  async registerToken(
    userId: string,
    email: string,
  ): Promise<{ token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '4h',
      secret,
    });

    return { token };
  }
}
