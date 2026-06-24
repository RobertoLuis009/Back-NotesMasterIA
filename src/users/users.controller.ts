import { Controller, Get, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

interface JwtUser {
  sub: string;
  email: string;
  name?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  async me(@Req() req: Request) {
    const { sub } = req.user as JwtUser;
    const user = await this.usersService.findByAuth0Id(sub);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  @Post('me')
  @ApiCreatedResponse({ type: UserResponseDto })
  sync(@Req() req: Request) {
    const { sub, email, name } = req.user as JwtUser;
    return this.usersService.findOrCreate(sub, email, name);
  }
}
