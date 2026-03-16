import { Controller, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AdjustReservationDto } from './dto/adjust-reservation.dto';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.reservationService.confirmReservation(id);
  }

  @Delete(':id')
  release(@Param('id') id: string) {
    return this.reservationService.releaseReservation(id);
  }

  @Patch(':id')
  adjust(@Param('id') id: string, @Body() adjustReservationDto: AdjustReservationDto) {
    return this.reservationService.adjustReservation(id, adjustReservationDto.quantity);
  }
}
