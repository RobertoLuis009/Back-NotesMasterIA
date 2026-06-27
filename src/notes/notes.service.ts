import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

const NOTE_SELECT = {
  id: true,
  title: true,
  content: true,
  isFavorite: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NoteSelect;

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(auth0Id: string): Promise<number> {
    const user = await this.usersService.findByAuth0Id(auth0Id);
    if (!user) throw new NotFoundException('User not found');
    return user.id;
  }

  async create(auth0Id: string, dto: CreateNoteDto): Promise<NoteResponseDto> {
    const userId = await this.resolveUserId(auth0Id);

    const note = await this.prisma.note.create({
      data: { ...dto, userId },
      select: NOTE_SELECT,
    });

    return plainToInstance(NoteResponseDto, note);
  }

  async findAll(auth0Id: string): Promise<NoteResponseDto[]> {
    const Notes = await this.prisma.note.findMany({
      where: { user: { auth0Id } },
      select: NOTE_SELECT,
    });

    return plainToInstance(NoteResponseDto, Notes);
  }

  async findFavorites(auth0Id: string): Promise<NoteResponseDto[]> {
    const notes = await this.prisma.note.findMany({
      where: { user: { auth0Id }, isFavorite: true },
      select: NOTE_SELECT,
    });

    return plainToInstance(NoteResponseDto, notes);
  }

  async findOne(auth0Id: string, id: number): Promise<NoteResponseDto> {
    const userId = await this.resolveUserId(auth0Id);

    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      select: NOTE_SELECT,
    });
    if (!note) throw new NotFoundException('Note not found');

    return plainToInstance(NoteResponseDto, note);
  }

  async update(
    auth0Id: string,
    id: number,
    dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const userId = await this.resolveUserId(auth0Id);

    const existing = await this.prisma.note.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Note not found');

    const note = await this.prisma.note.update({
      where: { id },
      data: dto,
      select: NOTE_SELECT,
    });

    return plainToInstance(NoteResponseDto, note);
  }
}
