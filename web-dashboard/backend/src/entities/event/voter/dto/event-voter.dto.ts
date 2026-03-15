import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VotingEventType } from '../../../../enums';

export class UpsertEventVoterRequestDto {
  @ApiProperty({
    description: '',
  })
  @IsMongoId()
  voterId: string;

  @ApiProperty({
    description: 'Type of voting event (e.g., election, poll).',
    enum: VotingEventType,
    example: 'election',
  })
  @IsEnum(VotingEventType)
  voteType: VotingEventType;

  @ApiProperty({
    description: 'Unique identifier for the voting event.',
    example: 'election-2026',
  })
  @IsString()
  @IsNotEmpty()
  voteId: string;

  @ApiPropertyOptional({
    description: 'Whether the voter is allowed to vote in this event.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  canVote?: boolean;
}

export class RemoveEventVoterRequestDto {
  @ApiProperty({
    description: 'Student ID of the voter to be removed from the event.',
    example: '20123456',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Type of voting event (e.g., election, poll).',
    enum: VotingEventType,
    example: 'election',
  })
  @IsEnum(VotingEventType)
  voteType: VotingEventType;

  @ApiProperty({
    description: 'Unique identifier for the voting event.',
    example: 'election-2026',
  })
  @IsString()
  @IsNotEmpty()
  voteId: string;
}

/** Body DTO for assigning a voter to a specific event. */
export class AssignVoterBodyDto {
  @ApiProperty({
    description: 'The voter document ID to assign to the event.',
    example: '6800a1b2c3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  voterId: string;

  @ApiPropertyOptional({
    description: 'Whether the voter is allowed to vote. Defaults to true.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  canVote?: boolean;
}

/** Body DTO for removing a voter from a specific event (poll or election). */
export class RemoveVoterBodyDto {
  @ApiProperty({
    description: 'The voter document ID to remove from the event.',
    example: '6800a1b2c3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  voterId: string;
}
