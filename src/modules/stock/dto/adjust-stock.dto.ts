import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({
    example: 100,
    description: 'Quantity to add (positive) or subtract (negative)',
  })
  @IsNotEmpty()
  @IsInt()
  quantityDelta: number;

  @ApiPropertyOptional({ example: 'PO-12345', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  reference?: string;
}
