import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'Título da nota' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Conteúdo da nota' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Marcar como favorita' })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}
