import { Module } from '@nestjs/common';
import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import { VoterModule } from '../../voter';
import { EventVoterModule } from '../voter';
import { PrivilegedAuthGuard } from '../../../shared/gurads';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [VoterModule, EventVoterModule],
  controllers: [PollController],
  providers: [Reflector, PollService, PrivilegedAuthGuard],
  exports: [PollService],
})
export class PollModule {}
