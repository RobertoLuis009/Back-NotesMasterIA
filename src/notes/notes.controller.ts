import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOkResponse({ type: NoteResponseDto, isArray: true })
  findAll(@Req() req: Request) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.findAll(auth0Id);
  }

  @Get('recent')
  @ApiOkResponse({ type: NoteResponseDto, isArray: true })
  findRecent(@Req() req: Request) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.findRecent(auth0Id);
  }

  @Get('favorites')
  @ApiOkResponse({ type: NoteResponseDto, isArray: true })
  findFavorites(@Req() req: Request) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.findFavorites(auth0Id);
  }

  @Get('search')
  @ApiOkResponse({ isArray: true })
  search(@Req() req: Request, @Query('q') q: string) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.search(auth0Id, q);
  }

  @Get('insights/connections')
  @ApiOkResponse()
  countConnections(@Req() req: Request) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.countConnections(auth0Id);
  }

  @Get('insights/count')
  @ApiOkResponse()
  countNotes(@Req() req: Request) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.countNotes(auth0Id);
  }

  @Get(':id')
  @ApiOkResponse({ type: NoteResponseDto })
  findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.findOne(auth0Id, id);
  }

  @Get(':id/similar')
  @ApiOkResponse({ isArray: true })
  findSimilar(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.findSimilar(auth0Id, id);
  }

  @Post()
  @ApiCreatedResponse({ type: NoteResponseDto })
  create(@Req() req: Request, @Body() dto: CreateNoteDto) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.create(auth0Id, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: NoteResponseDto })
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ) {
    const { auth0Id } = req.user as AuthenticatedUser;
    return this.notesService.update(auth0Id, id, dto);
  }
}
