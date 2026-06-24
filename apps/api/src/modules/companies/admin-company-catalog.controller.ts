import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAdminGuard } from '../auth/guards/firebase-admin.guard';
import { CompanyCatalogService } from './company-catalog.service';
import { CreateCompanyCatalogItemDto } from './dto/create-company-catalog-item.dto';
import { UpdateCompanyCatalogItemDto } from './dto/update-company-catalog-item.dto';
import { ListCompanyCatalogQueryDto } from './dto/list-company-catalog-query.dto';

@ApiTags('admin-company-catalog')
@ApiBearerAuth()
@Controller('admin/company-catalog')
@UseGuards(FirebaseAdminGuard)
export class AdminCompanyCatalogController {
  constructor(private readonly catalogService: CompanyCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List company services and activities catalog items' })
  list(@Query() query: ListCompanyCatalogQueryDto) {
    return this.catalogService.listAdmin(query.type);
  }

  @Post()
  @ApiOperation({ summary: 'Create a catalog item (service or activity)' })
  create(@Body() dto: CreateCompanyCatalogItemDto) {
    return this.catalogService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a catalog item' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyCatalogItemDto) {
    return this.catalogService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a catalog item' })
  async remove(@Param('id') id: string) {
    await this.catalogService.delete(id);
    return { message: 'Catalog item deleted' };
  }
}
