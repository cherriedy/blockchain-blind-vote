import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { VotingEventType } from '../../../enums';

export class VoteScopeQueryDto {
  @ApiProperty({
    description: 'Type of the voting event.',
    enum: VotingEventType,
    example: VotingEventType.ELECTION,
  })
  @IsEnum(VotingEventType)
  @IsNotEmpty()
  voteType: VotingEventType;

  @ApiProperty({
    description: 'Unique identifier of the voting event.',
    example: '6630a1b2c3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  voteId: string;
}

export class RequestBlindSignatureDto {
  @ApiProperty({
    description: 'Student identifier of the voter.',
    example: 'SV001',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Type of the voting event.',
    enum: VotingEventType,
    example: VotingEventType.ELECTION,
  })
  @IsEnum(VotingEventType)
  @IsNotEmpty()
  voteType: VotingEventType;

  @ApiProperty({
    description: 'Unique identifier of the voting event.',
    example: '6630a1b2c3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  voteId: string;

  @ApiProperty({
    description:
      'Blinded message computed client-side as: H(token) × r^e mod n, encoded as a hex string (0x-prefix optional).',
    example: '0xabcdef1234567890...',
  })
  @IsString()
  @IsNotEmpty()
  blindedMessage: string;
}

export interface BlindRsaPublicKeyResponseDto {
  n: string;
  e: string;
  keyBits: number;
  voteType: string;
  voteId: string;
}
