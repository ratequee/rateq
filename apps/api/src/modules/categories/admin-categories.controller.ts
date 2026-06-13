import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAdminGuard } from '../auth/guards/firebase-admin.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategoryServiceDto } from './dto/create-category-service.dto';
import { CategoriesService } from './categories.service';

@ApiTags('admin-categories')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(FirebaseAdminGuard)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a business category (Firebase admin)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Post(':categoryId/services')
  @ApiOperation({ summary: 'Add a service to a category (Firebase admin)' })
  addService(@Param('categoryId') categoryId: string, @Body() dto: CreateCategoryServiceDto) {
    return this.categoriesService.addService(categoryId, dto);
  }

  @Delete(':categoryId/services/:serviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a service from a category (Firebase admin)' })
  removeService(@Param('categoryId') categoryId: string, @Param('serviceId') serviceId: string) {
    return this.categoriesService.removeService(categoryId, serviceId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a business category (Firebase admin)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
