import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ example: 'Main', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '123 Main St', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;
}
