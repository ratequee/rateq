import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';
import { ContactService } from './contact.service';
import { SubmitContactDto } from './dto/submit-contact.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({ summary: 'Submit the public contact form' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  submit(@Body() dto: SubmitContactDto) {
    return this.contactService.submit(dto);
  }
}
