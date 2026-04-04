import { Module } from '@nestjs/common';
import { ElectionModule } from '../entities';
import { VotingContextModule } from './context';
import { VotingController } from './voting.controller';
import { EligibilityModule } from '../eligibility';
import { BlindSignatureModule } from './blind-signature';
import { BlockchainModule } from './blockchain';
import { BallotRequestModule } from './ballot-request/ballot-request.module';
import { VoteGateway } from './vote.gateway';

@Module({
  imports: [
    VotingContextModule,
    ElectionModule,
    EligibilityModule,
    BlindSignatureModule,
    BlockchainModule,
    BallotRequestModule,
  ],
  controllers: [VotingController],
  providers: [VoteGateway],
})
export class VotingModule {}
