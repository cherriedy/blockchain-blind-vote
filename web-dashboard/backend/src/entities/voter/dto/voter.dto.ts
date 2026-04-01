import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidWalletAddress } from '../../../shared';
import { PartialType } from '@nestjs/mapped-types';

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

  @ApiProperty({
    description: 'Full name of the voter. Should be at least 3 characters.',
    example: 'Nguyen Van A',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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

export class VoterStudentIdParamDto {
  @ApiProperty({
    description: 'Student ID of the voter.',
    example: '20123456',
  })
  @IsNotEmpty()
  studentId: string;
}
