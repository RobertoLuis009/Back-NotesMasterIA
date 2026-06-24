import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ description: 'ID interno do usuário' })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'ID do usuário no Auth0' })
  @Expose()
  auth0Id!: string;

  @ApiProperty({ description: 'E-mail do usuário' })
  @Expose()
  email!: string;

  @ApiPropertyOptional({ description: 'Nome do usuário' })
  @Expose()
  name!: string | null;

  @ApiProperty({ description: 'Data de criação da conta' })
  @Expose()
  createdAt!: Date;
}
