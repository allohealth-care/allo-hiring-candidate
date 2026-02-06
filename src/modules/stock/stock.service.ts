import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StockMovement,
  StockMovementType,
} from './entity/stock-movement.entity';
import { StockLevel } from './entity/stock-level.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockLevel)
    private readonly stockLevelRepository: Repository<StockLevel>,
  ) {}

  async findOrCreateStockLevel(
    productId: string,
    warehouseId: string,
  ): Promise<StockLevel> {
    let stockLevel = await this.stockLevelRepository.findOne({
      where: { productId, warehouseId },
      relations: ['product', 'warehouse'],
    });
    if (!stockLevel) {
      stockLevel = this.stockLevelRepository.create({
        productId,
        warehouseId,
        quantity: 0,
      });
      stockLevel = await this.stockLevelRepository.save(stockLevel);
      stockLevel = (await this.stockLevelRepository.findOne({
        where: { id: stockLevel.id },
        relations: ['product', 'warehouse'],
      })) as StockLevel;
    }
    return stockLevel;
  }

  async getStockLevel(
    productId: string,
    warehouseId: string,
  ): Promise<StockLevel> {
    const stockLevel = await this.findOrCreateStockLevel(
      productId,
      warehouseId,
    );
    return stockLevel;
  }

  async adjustStock(
    productId: string,
    warehouseId: string,
    adjustStockDto: AdjustStockDto,
  ): Promise<StockLevel> {
    const stockLevel = await this.findOrCreateStockLevel(
      productId,
      warehouseId,
    );
    const newQuantity = stockLevel.quantity + adjustStockDto.quantityDelta;
    if (newQuantity < 0) {
      throw new Error('Insufficient stock for adjustment');
    }
    stockLevel.quantity = newQuantity;
    await this.stockLevelRepository.manager.transaction(async (manager) => {
      await manager.save(stockLevel);
      const movement = manager.getRepository(StockMovement).create({
        stockLevelId: stockLevel.id,
        quantityDelta: adjustStockDto.quantityDelta,
        type: StockMovementType.ADJUSTMENT,
        reference: adjustStockDto.reference ?? null,
      });
      await manager.getRepository(StockMovement).save(movement);
    });
    return this.findOrCreateStockLevel(productId, warehouseId);
  }

  async findOne(id: string): Promise<StockLevel> {
    const stockLevel = await this.stockLevelRepository.findOne({
      where: { id },
      relations: ['product', 'warehouse'],
    });
    if (!stockLevel) {
      throw new NotFoundException(`Stock level with id ${id} not found`);
    }
    return stockLevel;
  }
}
