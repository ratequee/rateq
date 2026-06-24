import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CompanyCatalogService } from './company-catalog.service';
import { ListCompanyCatalogQueryDto } from './dto/list-company-catalog-query.dto';

@ApiTags('company-catalog')
@Controller('company-catalog')
export class CompanyCatalogController {
  constructor(private readonly catalogService: CompanyCatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active company services and activities for profile forms' })
  list(@Query() query: ListCompanyCatalogQueryDto) {
    return this.catalogService.listPublic(query.type);
  }
}
