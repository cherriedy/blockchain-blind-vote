import { Module } from '@nestjs/common';
import { EligibilityService } from './eligibility.service';
import { BallotRequestModule } from '../voting/ballot-request/ballot-request.module';

@Module({
  imports: [BallotRequestModule],
  providers: [EligibilityService],
  exports: [EligibilityService],
})
export class EligibilityModule {}
