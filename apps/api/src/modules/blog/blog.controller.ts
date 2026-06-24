import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BlogService } from './blog.service';
import { GetBlogPostQueryDto, ListBlogPostsQueryDto } from './dto/list-blog-posts-query.dto';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published blog posts for a locale' })
  list(@Query() query: ListBlogPostsQueryDto) {
    return this.blogService.listPublic(query.locale, query.page, query.limit);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published blog post by locale-specific slug' })
  getBySlug(@Param('slug') slug: string, @Query() query: GetBlogPostQueryDto) {
    return this.blogService.getBySlug(query.locale, slug);
  }
}
