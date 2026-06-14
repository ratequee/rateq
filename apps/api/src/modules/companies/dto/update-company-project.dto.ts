import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateCompanyProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsUrl()
  @MaxLength(2048)
  imageUrl!: string;

  @ApiProperty()
  @IsUrl()
  @MaxLength(2048)
  projectUrl!: string;
}
