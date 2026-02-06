import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockLevel } from './stock-level.entity';

export enum StockMovementType {
  ADJUSTMENT = 'ADJUSTMENT',
  RESERVATION_CONFIRM = 'RESERVATION_CONFIRM',
  RELEASE = 'RELEASE',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_level_id', type: 'uuid' })
  stockLevelId: string;

  @Column({ type: 'int' })
  quantityDelta: number;

  @Column({ type: 'varchar', length: 50 })
  type: StockMovementType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => StockLevel, (stockLevel) => stockLevel.movements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stock_level_id' })
  stockLevel: StockLevel;
}
