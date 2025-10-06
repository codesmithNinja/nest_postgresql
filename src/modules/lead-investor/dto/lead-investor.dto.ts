import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadInvestorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  investorType!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(50, 2000)
  bio!: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  investorPhoto!: string;
}
export class UpdateLeadInvestorDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  investorType?: string;

  @IsOptional()
  @IsString()
  @Length(50, 2000)
  bio?: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  investorPhoto?: string;
}

export class LeadInvestorResponseDto {
  id!: string;
  publicId!: string;
  investorPhoto!: string;
  name!: string;
  investorType!: string;
  bio!: string;
  equityId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
