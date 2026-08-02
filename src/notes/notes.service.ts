import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AI_PROVIDER } from '../ai/ai.provider';
import type { AiProvider } from '../ai/ai.provider';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

interface NoteRow {
  id: number;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  score: number;
}

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
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
  ) {}

  private async resolveUserId(auth0Id: string): Promise<number> {
    const user = await this.usersService.findByAuth0Id(auth0Id);
    if (!user) throw new NotFoundException('User not found');
    return user.id;
  }

  private async saveEmbedding(
    noteId: number,
    title: string,
    content: string,
  ): Promise<void> {
    try {
      const vector = await this.ai.embed(`${title}\n${content}`);
      const vectorStr = `[${vector.join(',')}]`;
      await this.prisma
        .$executeRaw`UPDATE "Note" SET embedding = ${vectorStr}::vector WHERE id = ${noteId}`;
    } catch (err) {
      this.logger.error(
        `Failed to generate embedding for note ${noteId}: ${err}`,
      );
    }
  }

  async create(auth0Id: string, dto: CreateNoteDto): Promise<NoteResponseDto> {
    const userId = await this.resolveUserId(auth0Id);

    const note = await this.prisma.note.create({
      data: { ...dto, userId },
      select: NOTE_SELECT,
    });

    await this.saveEmbedding(note.id, note.title, note.content);

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

    await this.saveEmbedding(note.id, note.title, note.content);

    return plainToInstance(NoteResponseDto, note);
  }

  async search(
    auth0Id: string,
    q: string,
  ): Promise<(NoteResponseDto & { score: number })[]> {
    const userId = await this.resolveUserId(auth0Id);
    const vector = await this.ai.embed(q);
    const vectorStr = `[${vector.join(',')}]`;

    const rows = await this.prisma.$queryRaw<NoteRow[]>`
      SELECT id, title, content, "isFavorite", "createdAt", "updatedAt",
             1 - (embedding <=> ${vectorStr}::vector) AS score
      FROM "Note"
      WHERE "userId" = ${userId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT 10
    `;

    return rows.map((r) => ({
      ...plainToInstance(NoteResponseDto, r),
      score: Number(r.score),
    }));
  }

  async findSimilar(
    auth0Id: string,
    id: number,
  ): Promise<(NoteResponseDto & { score: number })[]> {
    const userId = await this.resolveUserId(auth0Id);
    const threshold = 0.75;

    const rows = await this.prisma.$queryRaw<NoteRow[]>`
      SELECT n.id, n.title, n.content, n."isFavorite", n."createdAt", n."updatedAt",
             1 - (n.embedding <=> ref.embedding) AS score
      FROM "Note" n, "Note" ref
      WHERE ref.id = ${id}
        AND ref."userId" = ${userId}
        AND n."userId" = ${userId}
        AND n.id <> ${id}
        AND n.embedding IS NOT NULL
        AND ref.embedding IS NOT NULL
        AND 1 - (n.embedding <=> ref.embedding) >= ${threshold}
      ORDER BY n.embedding <=> ref.embedding
      LIMIT 5
    `;

    return rows.map((r) => ({
      ...plainToInstance(NoteResponseDto, r),
      score: Number(r.score),
    }));
  }

  async countConnections(auth0Id: string): Promise<{ count: number }> {
    const userId = await this.resolveUserId(auth0Id);
    const threshold = 0.75;

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) AS count
      FROM "Note" a
      JOIN "Note" b ON a.id < b.id
      WHERE a."userId" = ${userId}
        AND b."userId" = ${userId}
        AND a.embedding IS NOT NULL
        AND b.embedding IS NOT NULL
        AND 1 - (a.embedding <=> b.embedding) >= ${threshold}
    `;

    return { count: Number(result[0].count) };
  }

  async findRecent(auth0Id: string): Promise<NoteResponseDto[]> {
    const notes = await this.prisma.note.findMany({
      where: { user: { auth0Id } },
      select: NOTE_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return plainToInstance(NoteResponseDto, notes);
  }

  async countNotes(auth0Id: string): Promise<{ count: number }> {
    const userId = await this.resolveUserId(auth0Id);
    const result = await this.prisma.note.count({
      where: { userId },
    });
    return { count: result };
  }
}
