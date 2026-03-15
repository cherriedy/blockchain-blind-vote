import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsHexadecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { VotingEventType } from '../../enums';

export class CastVoteDto {
  @ApiProperty({ enum: VotingEventType, example: VotingEventType.ELECTION })
  @IsEnum(VotingEventType)
  voteType: VotingEventType;

  @ApiProperty({
    description: 'MongoDB ObjectId of the event',
    example: '6630a1b2c3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  voteId: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the candidate (only used for Election)',
    example: '6630a1b2c3d4e5f6a7b8c9d1',
    required: false,
  })
  @IsString()
  @IsOptional()
  candidateId?: string;

  @ApiProperty({
    description: 'Index of the option (only used for Poll, 0-based)',
    example: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  optionIndex?: number;

  @ApiProperty({
    description:
      'Message signed by backend with blind signature (hex bytes32, 0x-prefix)',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  })
  @IsString()
  @IsHexadecimal()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description:
      'RSA blind signature after unblinding (hex uint256, 0x-prefix)',
    example: '0x1234...',
  })
  @IsString()
  @IsHexadecimal()
  @IsNotEmpty()
  signature: string;
}

export class CastVoteResponseDto {
  @ApiProperty({ example: '0xabc123...' })
  txHash: string;
}
