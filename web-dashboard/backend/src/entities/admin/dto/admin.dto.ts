import {
  IsMongoId,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { IsValidWalletAddress } from 'src/shared';

export class AdminIdParamDto {
  @ApiProperty({
    description: 'Unique identifier for the admin (MongoDB ObjectId format).',
    example: '605c5f2e8e3b3a2f88d8b456',
  })
  @IsMongoId()
  id: string;
}

export class CreateAdminRequestDto {
  @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
  @IsString()
  @IsNotEmpty()
  @IsValidWalletAddress({ variant: 'ethereum' })
  walletAddress: string;

  @ApiProperty({ example: 'Nguyen Van Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AdminRole })
  @IsEnum(AdminRole)
  role: AdminRole;

  @ApiPropertyOptional({
    description:
      'Indicates whether the admin account is active. Defaults to true.',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAdminRequestDto extends PartialType(CreateAdminRequestDto) {}

export class AdminResponseDto {
  @ApiProperty({ example: '605c5f2e8e3b3a2f88d8b456' })
  id: string;

  @ApiProperty({
    enum: AdminRole,
    example: AdminRole.SUPER_ADMIN,
  })
  role: AdminRole;

  @ApiProperty({ example: 'Nguyen Van A' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  walletAddress: string;

  @ApiProperty({ example: '2026-03-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-15T08:30:00.000Z' })
  updatedAt: Date;
}
