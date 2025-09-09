import { Transform } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value)
  )
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : Number(value)
  )
  limit?: number = 10;
}
