import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsUrl,
} from 'class-validator';

export class CreateExtrasDocumentDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  documentUrl: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  documentTitle: string;
}

export class UpdateExtrasDocumentDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  documentTitle?: string;
}

export { ExtrasDocumentResponseDto } from '../../equity/dto/equity-response.dto';
