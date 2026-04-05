import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventRequestDto } from '../../event.dto';
import { VotingEventType } from '../../../../enums';
import { AdminResponseDto } from 'src/entities/admin';
import { VoterResponseDto } from 'src/entities/voter';
import { CandidateResponseDto } from 'src/entities/candidate';

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

  @ApiPropertyOptional({
    description: 'Whether voter list is finalized for this election.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  voterListFinalized?: boolean;
}

/** DTO for updating an election (all fields optional). */
export class UpdateElectionRequestDto extends PartialType(
  CreateElectionRequestDto,
) {
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

  @ApiPropertyOptional({
    description:
      'An optional introduction or statement from the candidate as part of their self-nomination.',
    example:
      'I am passionate about serving our student community and have experience in leadership roles.',
  })
  @IsString()
  @IsOptional()
  introduction?: string;
}

export class ResubmitSelfNominateDto extends SelfNominateDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van A',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Tieu su',
  })
  @IsOptional()
  @IsString()
  bio?: string;
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

  voter?: VoterResponseDto;
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

  @ApiProperty({ example: true })
  voterListFinalized: boolean;

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

export class SelfNominationResponseDto {
  @ApiProperty({ example: '65f1c2a3b4d5e6f7a8b9c0d1' })
  id: string;
  @ApiProperty({ example: '65f1c2a3b4d5e6f7a8b9c0d2' })
  electionId: string;
  @ApiProperty({ example: '65f1c2a3b4d5e6f7a8b9c0d3' })
  candidateId: string;
  @ApiPropertyOptional({
    example: 'A passionate student eager to serve the campus community.',
  })
  introduction?: string | null;
  @ApiProperty({ example: 'PENDING' })
  status: string;
  @ApiPropertyOptional({ example: 'Admin notes if rejected.' })
  adminNotes?: string | null;
  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  createdAt: Date;
  @ApiProperty({ example: '2026-03-15T08:30:00.000Z' })
  updatedAt: Date;

  candidate: CandidateResponseDto;
  admin?: AdminResponseDto;
  election: ElectionResponseDto;
}

export class EventAdminResponseDto {
  @ApiProperty({ example: '6800a1b2c3d4e5f6a7b8c9d0' })
  id: string;
  @ApiProperty({ example: '6800a1b2c3d4e5f6a7b8c9d1' })
  adminId: string;
  @ApiProperty({ example: '6800a1b2c3d4e5f6a7b8c9d2' })
  electionId: string;
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

export class ActionMessageResponseDto {
  @ApiProperty({ example: 'Voter removed from election.' })
  message: string;
}

export class GetElectionsQueryDto {
  @ApiPropertyOptional({
    example: 'public',
    description: 'Filter by visibility (public | private)',
  })
  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: string;
}

export class AssignAdminBodyDto {
  @ApiProperty({
    description: 'The admin document ID to assign to the election.',
    example: '6800a1b2c3d4e5f6a7b8c9d0',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  adminIds: string[];
}

export class RemoveAdminBodyDto {
  @ApiProperty({
    description: 'The admin document ID to remove from the election.',
    example: '6800a1b2c3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  adminId: string;
}

export class RejectSelfNomineeDto {
  @ApiProperty({ example: 'policy violation' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
export class RequestInfoSelfNomineeDto {
  @ApiProperty({ example: 'We need a clearer portrait photo.' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
