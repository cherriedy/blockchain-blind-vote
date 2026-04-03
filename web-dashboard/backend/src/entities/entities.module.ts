import { Module } from '@nestjs/common';
import { EventModule } from './event';
import { VoterModule } from './voter';
import { CandidateModule } from './candidate';
import { AuditLogModule } from './audit-log/log.module';

@Module({
  imports: [EventModule, VoterModule, CandidateModule, AuditLogModule],
})
export class EntitiesModule {}
