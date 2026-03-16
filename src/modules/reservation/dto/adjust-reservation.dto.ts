import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class AdjustReservationDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  quantity: number;
}
