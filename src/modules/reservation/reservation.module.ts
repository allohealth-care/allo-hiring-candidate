import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Reservation } from './entity/reservation.entity';
import { StockLevel } from '../stock/entity/stock-level.entity';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { reservationConfig } from '../../config';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, StockLevel]),
    ConfigModule.forFeature(reservationConfig),
    StockModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
})
export class ReservationModule {}
