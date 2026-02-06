import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiQuery({ name: 'productId', required: true, description: 'Product UUID' })
  @ApiQuery({
    name: 'warehouseId',
    required: true,
    description: 'Warehouse UUID',
  })
  getStockLevel(
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
  ) {
    return this.stockService.getStockLevel(productId, warehouseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockService.findOne(id);
  }

  @Patch('adjust/:productId/:warehouseId')
  adjustStock(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.stockService.adjustStock(
      productId,
      warehouseId,
      adjustStockDto,
    );
  }
}
