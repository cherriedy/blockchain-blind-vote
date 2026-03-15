import { Module } from '@nestjs/common';
import { EligibilityService } from './eligibility.service';
import { BallotRequestModule } from '../ballot-request/ballot-request.module';

@Module({
  imports: [BallotRequestModule],
  providers: [EligibilityService],
  exports: [EligibilityService],
})
export class EligibilityModule {}
