import {
  IsMongoId,
  IsString,
  IsArray,
  ArrayNotEmpty,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventRequestDto } from '../../event.dto';
import { AdminResponseDto } from 'src/entities/admin';

/** Params DTO for routes like `/poll/:id`. */
export class PollIdParamDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the poll.',
    example: '65f1c2a3b4d5e6f7a8b9c0d1',
  })
  @IsMongoId()
  id: string;
}

/**
 * Body DTO for creating a poll.
 */
export class CreatePollRequestDto extends CreateEventRequestDto {
  /** Poll-specific fields */
  @ApiProperty({
    description: 'The poll question to be answered by voters.',
    example: 'What is your favorite color?',
    minLength: 5,
  })
  @IsString()
  @MinLength(5)
  question: string;

  @ApiProperty({
    description: 'Array of options for the poll.',
    example: ['Red', 'Blue', 'Green'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options: string[];
}

/**
 * Body DTO for updating a poll.
 */
export class UpdatePollRequestDto extends PartialType(CreatePollRequestDto) {}

export class PollActionMessageResponseDto {
  @ApiProperty({ example: 'Voter removed from poll.' })
  message: string;
}
export class PollResponseDto {
  @ApiProperty({ example: '65f1c2a3b4d5e6f7a8b9c0d1' })
  id: string;

  @ApiProperty({ example: 'Khảo sát ý kiến sinh viên 2026' })
  name: string;

  @ApiPropertyOptional({
    example: 'Khảo sát ý kiến sinh viên về chất lượng giảng dạy.',
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

  @ApiProperty({ example: 'Bạn đánh giá thế nào về chất lượng giảng dạy?' })
  question: string;

  @ApiProperty({ type: [String] })
  options: string[];

  @ApiProperty({ type: [Number] })
  votes: number[];

  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-15T08:30:00.000Z' })
  updatedAt: Date;
}

export class GetPollsQueryDto {
  @ApiPropertyOptional({
    example: 'public',
    description: 'Filter by visibility (public | private)',
  })
  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: string;
}
