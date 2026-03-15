import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventRequestDto } from '../../event.dto';
import { VotingEventType } from '../../../../enums';

/** DTO for creating an election. */
export class CreateElectionRequestDto extends CreateEventRequestDto {
  /** Election-specific fields */
  @ApiProperty({
    description:
      'Array of candidate IDs (MongoDB ObjectIds) for this election.',
    example: ['65f1c2a3b4d5e6f7a8b9c0d1', '65f1c2a3b4d5e6f7a8b9c0d2'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  candidateIds: string[];

  @ApiPropertyOptional({
    description: 'Whether self-nomination is allowed for this election.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  allowSelfNomination?: boolean;

  // @ApiPropertyOptional({
  //   description: 'Array of self-nominated candidate IDs (MongoDB ObjectIds).',
  //   example: ['65f1c2a3b4d5e6f7a8b9c0d3'],
  //   type: [String],
  // })
  // @IsArray()
  // @IsOptional()
  // @IsString({ each: true })
  // selfNominatedCandidates?: string[];

  @ApiPropertyOptional({
    description:
      'A record of votes, where the key is the candidateId and the value is the vote count.',
    example: {
      '65f1c2a3b4d5e6f7a8b9c0d1': 100,
      '65f1c2a3b4d5e6f7a8b9c0d2': 80,
    },
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  @IsObject()
  @IsOptional()
  votes?: Record<string, number>;
}

/** DTO for updating an election (all fields optional). */
export class UpdateElectionRequestDto extends PartialType(
  CreateElectionRequestDto,
) {}

/** DTO for validating election id param (MongoId). */
export class ElectionIdParamDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the election.',
    example: '65f1c2a3b4d5e6f7a8b9c0d1',
  })
  @IsMongoId()
  id: string;
}

/** DTO for self-nomination request. */
export class SelfNominateDto {
  @ApiProperty({
    description:
      'Ethereum wallet address of the voter wishing to self-nominate.',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  walletAddress: string;

  @ApiProperty({
    description: 'Student ID of the voter wishing to self-nominate.',
    example: 'SV2021001',
  })
  @IsString()
  studentId: string;
}

export class ElectionResponseDto {
  @ApiProperty({ example: '65f1c2a3b4d5e6f7a8b9c0d1' })
  id: string;

  @ApiProperty({ example: 'Student Council 2026' })
  name: string;

  @ApiPropertyOptional({
    example: 'Election for student council executive board 2026.',
  })
  description?: string | null;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'public' })
  visibility: string;

  @ApiProperty({ example: false })
  isAutomatic: boolean;

  @ApiPropertyOptional({ example: 1742000000 })
  startAt?: number | null;

  @ApiPropertyOptional({ example: 1743000000 })
  endAt?: number | null;

  @ApiProperty({ type: [String] })
  candidateIds: string[];

  @ApiProperty({ example: true })
  allowSelfNomination: boolean;

  @ApiProperty({ type: [String] })
  selfNominatedCandidates: string[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  votes: Record<string, number>;

  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-15T08:30:00.000Z' })
  updatedAt: Date;
}

export class ElectionCandidateResponseDto {
  @ApiProperty({ example: '65f1c2a3b4d5e6f7a8b9c0d2' })
  id: string;

  @ApiProperty({ example: 'SV2021001' })
  studentId: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  name: string;

  @ApiPropertyOptional({
    example: 'A senior student passionate about campus activities.',
  })
  bio?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string | null;

  @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
  walletAddress: string;

  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-15T08:30:00.000Z' })
  updatedAt: Date;
}

export class ElectionCandidatesResponseDto {
  @ApiProperty({ type: [ElectionCandidateResponseDto] })
  assigned: ElectionCandidateResponseDto[];

  @ApiProperty({ type: [ElectionCandidateResponseDto] })
  selfNominated: ElectionCandidateResponseDto[];
}

export class EventVoterResponseDto {
  @ApiProperty({ example: '6800a1b2c3d4e5f6a7b8c9d0' })
  id: string;

  @ApiProperty({ example: '6800a1b2c3d4e5f6a7b8c9d1' })
  voterId: string;

  @ApiProperty({ enum: VotingEventType, example: VotingEventType.ELECTION })
  voteType: string;

  @ApiProperty({ example: '6800a1b2c3d4e5f6a7b8c9d2' })
  voteId: string;

  @ApiProperty({ example: true })
  canVote: boolean;

  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-15T08:30:00.000Z' })
  updatedAt: Date;
}

export class ActionMessageResponseDto {
  @ApiProperty({ example: 'Voter removed from election.' })
  message: string;
}
