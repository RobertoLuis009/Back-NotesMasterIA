import { Controller, Get, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  async me(@Req() req: Request) {
    const { auth0Id } = req.user as AuthenticatedUser;
    const user = await this.usersService.findByAuth0Id(auth0Id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  @Post('me')
  @ApiCreatedResponse({ type: UserResponseDto })
  sync(@Req() req: Request) {
    return this.usersService.findOrCreate(req.user as AuthenticatedUser);
  }
}
