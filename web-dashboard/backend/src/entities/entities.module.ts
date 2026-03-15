import { Module } from '@nestjs/common';
import { EventModule } from './event';
import { VoterModule } from './voter';
import { CandidateModule } from './candidate';

@Module({
  imports: [EventModule, VoterModule, CandidateModule],
})
export class EntitiesModule {}
