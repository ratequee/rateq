import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RecordPageViewDto {
  @ApiProperty({
    description: 'Anonymous browser visitor id used to count one visit per company per day',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  visitorId!: string;
}
