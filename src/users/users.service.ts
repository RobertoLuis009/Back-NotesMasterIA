import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';

const USER_SELECT = {
  id: true,
  auth0Id: true,
  email: true,
  name: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByAuth0Id(auth0Id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { auth0Id },
      select: USER_SELECT,
    });

    return user ? plainToInstance(UserResponseDto, user) : null;
  }

  async findOrCreate(
    auth0Id: string,
    email: string,
    name?: string,
  ): Promise<UserResponseDto> {
    const existingUser = await this.findByAuth0Id(auth0Id);

    if (existingUser) {
      return existingUser;
    }

    try {
      const user = await this.prisma.user.create({
        data: { auth0Id, email, name },
        select: USER_SELECT,
      });

      return plainToInstance(UserResponseDto, user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.findByAuth0Id(auth0Id) as Promise<UserResponseDto>;
      }

      throw error;
    }
  }
}
