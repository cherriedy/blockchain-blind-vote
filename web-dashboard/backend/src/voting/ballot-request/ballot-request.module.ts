import { Module } from '@nestjs/common';
import { BallotRequestService } from './ballot-request.service';

@Module({
  providers: [BallotRequestService],
  exports: [BallotRequestService],
})
export class BallotRequestModule {}
