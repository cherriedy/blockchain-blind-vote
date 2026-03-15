import { IsMongoId, IsString, IsOptional, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CandidateIdParamDto {
  @ApiProperty({
    description:
      'Unique identifier for the candidate (MongoDB ObjectId format).',
    example: '605c5f2e8e3b3a2f88d8b456',
  })
  @IsMongoId()
  id: string;
}

export class CreateCandidateRequestDto {
  @ApiProperty({
    description: 'Student ID of the candidate.',
    example: 'SV2021001',
  })
  @IsString()
  studentId: string;

  @ApiProperty({
    description: 'Full name of the candidate. Should be at least 3 characters.',
    example: 'Nguyen Van A',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    description: 'Short biography or introduction for the candidate.',
    example:
      'A senior student majoring in Computer Science, passionate about student activities.',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description:
      'URL to the candidate’s avatar image. Should be a valid image link.',
    example: 'https://example.com/images/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description:
      'Ethereum wallet address of the candidate. Used for blockchain-based voting.',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  walletAddress: string;
}

export class UpdateCandidateRequestDto extends PartialType(
  CreateCandidateRequestDto,
) {}

export class CandidateResponseDto {
  @ApiProperty({ example: '605c5f2e8e3b3a2f88d8b456' })
  id: string;

  @ApiProperty({ example: 'SV2021001' })
  studentId: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  name: string;

  @ApiPropertyOptional({
    example:
      'Sinh viên năm cuối ngành Công nghệ thông tin, từng là chủ nhiệm CLB Lập trình.',
  })
  bio?: string | null;

  @ApiPropertyOptional({
    example: 'https://randomuser.me/api/portraits/men/32.jpg',
  })
  avatarUrl?: string | null;

  @ApiProperty({
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  walletAddress: string;

  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-15T08:30:00.000Z' })
  updatedAt: Date;
}
