import {
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VotingEventStatus, VotingEventVisibility } from '../../enums';
import { RequireProperties } from '../../shared';

/**
 * Base DTO for creating a voting event (poll or election).
 */
export class CreateEventRequestDto {
  @ApiProperty({
    description:
      'The official title of the voting event. This should be a clear, concise name that uniquely identifies the event for participants and administrators.',
    example: 'Student Council Election 2026',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    description:
      'A detailed explanation of the event, including its purpose, scope, and any special instructions or eligibility requirements for participants.',
    example:
      'This election determines the new student council president and vice president. All enrolled students are eligible to vote.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description:
      'The current status of the voting event. Indicates whether the event is pending, active, or completed. Used to control the event lifecycle.',
    enum: VotingEventStatus,
    example: VotingEventStatus.PENDING,
  })
  @IsEnum(VotingEventStatus)
  @IsOptional()
  status?: VotingEventStatus;

  @ApiPropertyOptional({
    description:
      'Specifies who can view the event. PUBLIC means all users can see the event, PRIVATE restricts visibility to certain users or groups.',
    enum: VotingEventVisibility,
    example: VotingEventVisibility.PUBLIC,
  })
  @IsEnum(VotingEventVisibility)
  @IsOptional()
  visibility?: VotingEventVisibility;

  @ApiPropertyOptional({
    description:
      'Set to true if the event should start and end automatically at the specified times. Requires both startAt and endAt to be provided.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  @RequireProperties(['startAt', 'endAt'])
  isAutomatic?: boolean;

  @ApiPropertyOptional({
    description:
      'The start time of the event, represented as a Unix timestamp in milliseconds. Required if isAutomatic is true.',
    example: 1780000000000,
    type: Number,
  })
  @IsOptional()
  startAt?: number;

  @ApiPropertyOptional({
    description:
      'The end time of the event, represented as a Unix timestamp in milliseconds. Required if isAutomatic is true.',
    example: 1780086400000,
    type: Number,
  })
  @IsOptional()
  endAt?: number;
}
