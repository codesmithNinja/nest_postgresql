import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class FileUploadResponseDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  mimetype!: string;

  @IsNumber()
  size!: number;
}
