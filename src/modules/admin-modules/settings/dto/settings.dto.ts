import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordType } from '../../../../common/enums/database-type.enum';

export class CreateSettingsDto {
  @ApiProperty({
    description: 'Settings group type',
    example: 'site_setting',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Group type must contain only letters, numbers, underscores, and hyphens',
  })
  groupType!: string;

  @ApiPropertyOptional({
    description: 'Record type',
    enum: RecordType,
    default: RecordType.STRING,
  })
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;

  @ApiProperty({
    description: 'Settings key',
    example: 'site_name',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Key must contain only letters, numbers, underscores, and hyphens',
  })
  key!: string;

  @ApiProperty({
    description: 'Settings value',
    example: 'My Website',
  })
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Record type',
    enum: RecordType,
  })
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;

  @ApiPropertyOptional({
    description: 'Settings value',
    example: 'Updated Website Name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  value?: string;
}

export class SettingsResponseDto {
  @ApiProperty({
    description: 'Settings ID',
    example: 'clxxxxxxxxxxxxxxx',
  })
  id!: string;

  @ApiProperty({
    description: 'Settings group type',
    example: 'site_setting',
  })
  groupType!: string;

  @ApiProperty({
    description: 'Record type',
    enum: RecordType,
    example: RecordType.STRING,
  })
  recordType!: RecordType;

  @ApiProperty({
    description: 'Settings key',
    example: 'site_name',
  })
  key!: string;

  @ApiProperty({
    description: 'Settings value',
    example: 'My Website',
  })
  value!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-12-01T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-12-01T10:00:00Z',
  })
  updatedAt!: Date;
}

export class GroupTypeParamDto {
  @ApiProperty({
    description: 'Settings group type',
    example: 'site_setting',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Group type must contain only letters, numbers, underscores, and hyphens',
  })
  groupType!: string;
}

export class BulkSettingsDto {
  @ApiProperty({
    description: 'Array of settings to create or update',
    type: [CreateSettingsDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateSettingsDto)
  settings!: CreateSettingsDto[];
}

export class SettingsListResponseDto {
  @ApiProperty({
    description: 'List of settings',
    type: [SettingsResponseDto],
  })
  settings!: SettingsResponseDto[];

  @ApiProperty({
    description: 'Group type',
    example: 'site_setting',
  })
  groupType!: string;

  @ApiProperty({
    description: 'Total count of settings',
    example: 5,
  })
  count!: number;
}

export class FileUploadSettingsDto {
  @ApiPropertyOptional({
    description: 'Record type',
    enum: RecordType,
    default: RecordType.FILE,
  })
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;
}

export class SettingsErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Settings not found',
  })
  message!: string;

  @ApiProperty({
    description: 'Error code',
    example: 'SETTINGS_NOT_FOUND',
  })
  code!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode!: number;
}
