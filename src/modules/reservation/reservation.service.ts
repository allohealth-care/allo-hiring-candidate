import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Reservation } from './entity/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { StockLevel } from '../stock/entity/stock-level.entity';
import { ConfigService } from '@nestjs/config';
import { StockService } from '../stock/stock.service';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReservationService {
  private readonly LOCK_TTL = 10; // 10 seconds

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(StockLevel)
    private readonly stockLevelRepository: Repository<StockLevel>,
    private readonly stockService: StockService,
    private readonly configService: ConfigService,
    private readonly connection: Connection,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  private async acquireLock(lockKey: string, lockValue: string, ttl: number): Promise<boolean> {
    const result = await this.redisClient.set(lockKey, lockValue, 'EX', ttl, 'NX');
    return result === 'OK';
  }

  private async releaseLock(lockKey: string, lockValue: string): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.redisClient.eval(script, 1, lockKey, lockValue);
  }

  async create(createReservationDto: CreateReservationDto) {
    const { productId, warehouseId, quantity, orderReference } = createReservationDto;
    const lockKey = `stock:${productId}:${warehouseId}`;
    const lockValue = uuidv4();

    if (!(await this.acquireLock(lockKey, lockValue, this.LOCK_TTL))) {
      throw new BadRequestException('Could not acquire lock for this stock, please try again.');
    }

    try {
      return await this.connection.transaction(async (manager) => {
        const stockLevel = await manager.findOne(StockLevel, { where: { productId, warehouseId } });

        if (!stockLevel) {
          throw new NotFoundException('Stock level not found for the given product and warehouse.');
        }

        const reservationTtlSeconds = this.configService.get<number>('reservation.ttlSeconds');
        const activeReservationTime = new Date(Date.now() - reservationTtlSeconds * 1000);

        const { reservedQuantity } = await manager
          .createQueryBuilder(Reservation, 'reservation')
          .select('SUM(reservation.quantity)', 'reservedQuantity')
          .where('reservation.productId = :productId', { productId })
          .andWhere('reservation.warehouseId = :warehouseId', { warehouseId })
          .andWhere('reservation.createdAt > :activeReservationTime', { activeReservationTime })
          .getRawOne();

        const availableStock = stockLevel.quantity - (parseInt(reservedQuantity, 10) || 0);

        if (quantity > availableStock) {
          throw new BadRequestException('Not enough stock available for reservation.');
        }

        const reservation = manager.create(Reservation, {
          productId,
          warehouseId,
          quantity,
          orderReference,
        });

        return manager.save(reservation);
      });
    } finally {
      await this.releaseLock(lockKey, lockValue);
    }
  }

  async confirmReservation(reservationId: string) {
    const reservation = await this.reservationRepository.findOne({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    const { productId, warehouseId, quantity, orderReference } = reservation;
    const lockKey = `stock:${productId}:${warehouseId}`;
    const lockValue = uuidv4();

    if (!(await this.acquireLock(lockKey, lockValue, this.LOCK_TTL))) {
      throw new BadRequestException('Could not acquire lock for this stock, please try again.');
    }

    try {
      return await this.connection.transaction(async (manager) => {
        await manager.delete(Reservation, reservationId);
        return this.stockService.adjustStock(productId, warehouseId, {
          quantityDelta: -quantity,
          reference: `sale_reserved_${orderReference}`,
        });
      });
    } finally {
      await this.releaseLock(lockKey, lockValue);
    }
  }

  async releaseReservation(reservationId: string) {
    const reservation = await this.reservationRepository.findOne({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }
    await this.reservationRepository.delete(reservationId);
  }

  async adjustReservation(reservationId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive.');
    }

    const reservation = await this.reservationRepository.findOne({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    const { productId, warehouseId } = reservation;
    const lockKey = `stock:${productId}:${warehouseId}`;
    const lockValue = uuidv4();

    if (!(await this.acquireLock(lockKey, lockValue, this.LOCK_TTL))) {
      throw new BadRequestException('Could not acquire lock for this stock, please try again.');
    }

    try {
      return await this.connection.transaction(async (manager) => {
        const stockLevel = await manager.findOne(StockLevel, { where: { productId, warehouseId } });
        if (!stockLevel) {
          throw new NotFoundException('Stock level not found for the given product and warehouse.');
        }

        const reservationTtlSeconds = this.configService.get<number>('reservation.ttlSeconds');
        const activeReservationTime = new Date(Date.now() - reservationTtlSeconds * 1000);

        const { reservedQuantity } = await manager
          .createQueryBuilder(Reservation, 'reservation')
          .select('SUM(reservation.quantity)', 'reservedQuantity')
          .where('reservation.productId = :productId', { productId })
          .andWhere('reservation.warehouseId = :warehouseId', { warehouseId })
          .andWhere('reservation.createdAt > :activeReservationTime', { activeReservationTime })
          .andWhere('reservation.id != :reservationId', { reservationId })
          .getRawOne();

        const availableStock = stockLevel.quantity - (parseInt(reservedQuantity, 10) || 0);

        if (quantity > availableStock) {
          throw new BadRequestException('Not enough stock available for reservation adjustment.');
        }

        reservation.quantity = quantity;
        return manager.save(reservation);
      });
    } finally {
      await this.releaseLock(lockKey, lockValue);
    }
  }
}
