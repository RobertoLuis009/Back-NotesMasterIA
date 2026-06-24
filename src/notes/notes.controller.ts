import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

interface JwtUser {
  sub: string;
  email: string;
  name?: string;
}

@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiCreatedResponse({ type: NoteResponseDto })
  create(@Req() req: Request, @Body() dto: CreateNoteDto) {
    const { sub } = req.user as JwtUser;
    return this.notesService.create(sub, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: NoteResponseDto })
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ) {
    const { sub } = req.user as JwtUser;
    return this.notesService.update(sub, id, dto);
  }
}
