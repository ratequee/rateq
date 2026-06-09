import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all business categories' })
  list() {
    return this.categoriesService.listPublic();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a business category by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getBySlug(slug);
  }
}
