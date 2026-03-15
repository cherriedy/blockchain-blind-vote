import { forwardRef, Module } from '@nestjs/common';
import { EventVoterService } from './event-voter.service';
import { VoterModule } from '../../voter';

@Module({
  imports: [forwardRef(() => VoterModule)],
  providers: [EventVoterService],
  exports: [EventVoterService],
})
export class EventVoterModule {}
