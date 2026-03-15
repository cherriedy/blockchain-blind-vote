import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidWalletAddress } from '../../../shared';

export class CreateVoterRequestDto {
  @ApiProperty({
    description:
      'Student ID of the voter. Must be unique and match the university records.',
    example: '20123456',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description:
      'Ethereum wallet address of the voter. Used for blockchain-based authentication and voting.',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsNotEmpty()
  @IsValidWalletAddress({ variant: 'ethereum' })
  walletAddress: string;

  @ApiPropertyOptional({
    description:
      'Whether the voter is currently active and eligible to participate.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetVoterStatusRequestDto {
  @ApiProperty({
    description: 'Student ID of the voter whose status is being updated.',
    example: '20123456',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'New active status for the voter.',
    example: false,
  })
  @IsBoolean()
  isActive: boolean;
}

export class VoterIdParamDto {
  @ApiProperty({ description: 'MongoDB ObjectId of the voter.' })
  @IsMongoId()
  id: string;
}
