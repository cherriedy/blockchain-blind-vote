import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { VotingEventType } from '../../enums';
import { IsValidWalletAddress } from '../index';

export class StudentScopedRequestDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(VotingEventType)
  @IsNotEmpty()
  voteType: VotingEventType;

  @IsString()
  @IsNotEmpty()
  voteId: string;
}

export class WalletScopedRequestDto extends StudentScopedRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsValidWalletAddress({ variant: 'ethereum' })
  walletAddress: string;
}
