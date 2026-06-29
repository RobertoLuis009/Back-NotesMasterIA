import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
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

  async findOrCreate(input: AuthenticatedUser): Promise<UserResponseDto> {
    const { auth0Id, email, name, emailVerified } = input;

    const existingUser = await this.findByAuth0Id(auth0Id);

    if (existingUser) {
      return existingUser;
    }

    // A partir daqui é criação de conta nova: o e-mail precisa existir e ser
    // confiável. O `sub` (auth0Id) é a identidade; o e-mail é um atributo.
    if (!email) {
      throw new UnauthorizedException(
        'Token não contém e-mail. Configure a Auth0 Action para injetar o claim de e-mail.',
      );
    }

    if (!emailVerified) {
      throw new ForbiddenException(
        'E-mail não verificado. Verifique seu e-mail no provedor antes de criar a conta.',
      );
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
