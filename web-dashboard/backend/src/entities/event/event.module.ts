import { Module } from '@nestjs/common';
import { ElectionModule } from './election';
import { PollModule } from './poll';
import { EventVoterModule } from './voter';

@Module({
  imports: [ElectionModule, PollModule, EventVoterModule],
  exports: [ElectionModule, PollModule, EventVoterModule],
})
export class EventModule {}
