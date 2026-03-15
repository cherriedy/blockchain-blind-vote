import { Module } from '@nestjs/common';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';
import { VoterModule } from '../../voter';
import { EventVoterModule } from '../voter';
import { PrivilegedAuthGuard } from '../../../shared/gurads';
import { CandidateModule } from '../../candidate';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [VoterModule, EventVoterModule, CandidateModule],
  controllers: [ElectionController],
  providers: [Reflector, ElectionService, PrivilegedAuthGuard],
  exports: [ElectionService],
})
export class ElectionModule {}
