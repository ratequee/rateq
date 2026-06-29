import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategorySubcategoryDto } from './dto/create-category-subcategory.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('admin-categories')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.CONTENT)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a business category (admin)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a business category (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Post(':id/subcategories')
  @ApiOperation({ summary: 'Add a subcategory to a business category (admin)' })
  addSubcategory(@Param('id') id: string, @Body() dto: CreateCategorySubcategoryDto) {
    return this.categoriesService.addSubcategory(id, dto);
  }

  @Delete(':id/subcategories/:subcategoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a subcategory (admin)' })
  removeSubcategory(@Param('id') id: string, @Param('subcategoryId') subcategoryId: string) {
    return this.categoriesService.removeSubcategory(id, subcategoryId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a business category (admin)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
