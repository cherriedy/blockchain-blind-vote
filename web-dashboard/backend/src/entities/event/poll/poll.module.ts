import { Module } from '@nestjs/common';
import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import { VoterModule } from '../../voter';
import { EventVoterModule } from '../voter';
import { PollPermissionGuard } from 'src/shared/guards';

@Module({
  imports: [VoterModule, EventVoterModule],
  controllers: [PollController],
  providers: [PollService, PollPermissionGuard],
  exports: [PollService],
})
export class PollModule {}
