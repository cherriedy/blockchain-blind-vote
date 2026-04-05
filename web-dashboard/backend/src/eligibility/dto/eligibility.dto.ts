import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsValidWalletAddress } from '../../shared';

export class EligibilityChallengeRequestDto {
  @ApiProperty({ description: 'Student identifier' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Wallet address to verify' })
  @IsString()
  @IsNotEmpty()
  @IsValidWalletAddress({ variant: 'ethereum' })
  walletAddress: string;

  @ApiProperty({
    description: 'Voting event type',
    required: false,
  })
  @IsOptional()
  @IsString()
  voteType?: string;

  @ApiProperty({
    description: 'Voting event id',
    required: false,
  })
  @IsOptional()
  @IsString()
  voteId?: string;
}

export class EligibilityVerifyRequestDto {
  @ApiProperty({ description: 'Student identifier' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Wallet address to verify' })
  @IsString()
  @IsNotEmpty()
  @IsValidWalletAddress({ variant: 'ethereum' })
  walletAddress: string;

  @ApiProperty({ description: 'Signature proving ownership of the wallet' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Voting event type',
    required: false,
  })
  @IsOptional()
  @IsString()
  voteType?: string;

  @ApiProperty({
    description: 'Voting event id',
    required: false,
  })
  @IsOptional()
  @IsString()
  voteId?: string;
}

export class EligibilityVerifyResponseDto {
  @ApiProperty({
    description: 'Eligibility verification result',
    example: true,
  })
  valid: boolean;
}

export class EligibilityChallengeResponseDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6', description: 'Challenge nonce' })
  nonce: string;

  @ApiProperty({
    example: '2026-03-15T12:00:00.000Z',
    description: 'Challenge expiration time (ISO8601)',
  })
  expiresAt: Date;

  @ApiProperty({
    example: 'Voting eligibility challenge:election:123:a1b2c3d4e5f6',
    description: 'Message to be signed by the wallet',
  })
  message: string;
}

export class EligibilityAlreadyVerifiedResponseDto {
  @ApiProperty({ example: true })
  verified: true;

  @ApiProperty({
    example:
      'You have already completed the eligibility challenge for this voting event.',
  })
  message: string;
}

export type CreateEligibilityChallengeResponseDto =
  | EligibilityChallengeResponseDto
  | EligibilityAlreadyVerifiedResponseDto;
