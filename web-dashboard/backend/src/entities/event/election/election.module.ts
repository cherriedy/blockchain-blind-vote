import { Module } from '@nestjs/common';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';
import { VoterModule } from '../../voter';
import { EventVoterModule } from '../voter';
import { CandidateModule } from '../../candidate';
import { ElectionPermissionGuard } from 'src/shared/guards/election-permission.guard';

@Module({
  imports: [VoterModule, EventVoterModule, CandidateModule],
  controllers: [ElectionController],
  providers: [ElectionService, ElectionPermissionGuard],
  exports: [ElectionService],
})
export class ElectionModule {}
