import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Number of records affected' })
  count!: number;

  @ApiProperty({ description: 'Success message' })
  message!: string;
}
