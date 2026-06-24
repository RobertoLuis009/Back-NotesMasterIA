import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NoteResponseDto {
  @ApiProperty({ description: 'ID interno da nota' })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Título da nota' })
  @Expose()
  title!: string;

  @ApiProperty({ description: 'Conteúdo da nota' })
  @Expose()
  content!: string;

  @ApiProperty({ description: 'Se a nota está marcada como favorita' })
  @Expose()
  isFavorite!: boolean;

  @ApiProperty({ description: 'Data de criação da nota' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  @Expose()
  updatedAt!: Date;
}
