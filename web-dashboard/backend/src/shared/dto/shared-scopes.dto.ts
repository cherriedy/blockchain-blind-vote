import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { VotingEventType } from '../../enums';
import { IsValidWalletAddress } from '../index';

export class VoteScopedRequestDto {
  @IsEnum(VotingEventType)
  @IsNotEmpty()
  voteType: VotingEventType;

  @IsString()
  @IsNotEmpty()
  voteId: string;
}

export class StudentScopedRequestDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class WalletScopedRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsValidWalletAddress({ variant: 'ethereum' })
  walletAddress: string;
}
