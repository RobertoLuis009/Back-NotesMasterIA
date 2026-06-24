import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'Título da nota' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Conteúdo da nota' })
  @IsString()
  content!: string;
}
