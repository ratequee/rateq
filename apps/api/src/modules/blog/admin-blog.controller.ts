import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';
import { AdminListBlogPostsQueryDto } from './dto/list-blog-posts-query.dto';

@ApiTags('admin-blog')
@ApiBearerAuth()
@Controller('admin/blog')
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.CONTENT)
export class AdminBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'List blog posts (Firebase admin)' })
  list(@Query() query: AdminListBlogPostsQueryDto) {
    return this.blogService.listAdmin(query.status, query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a blog post by id (Firebase admin)' })
  getById(@Param('id') id: string) {
    return this.blogService.getAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a blog post (Firebase admin)' })
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog post (Firebase admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a blog post (Firebase admin)' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
