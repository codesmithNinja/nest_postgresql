import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsUrl,
} from 'class-validator';

export class CreateExtrasImageDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  imageTitle: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 1000)
  imageDescription: string;
}

export class UpdateExtrasImageDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  imageTitle?: string;

  @IsOptional()
  @IsString()
  @Length(10, 1000)
  imageDescription?: string;
}

export { ExtrasImageResponseDto } from '../../equity/dto/equity-response.dto';
