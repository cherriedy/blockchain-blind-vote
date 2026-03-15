import { forwardRef, Module } from '@nestjs/common';
import { VoterService } from './voter.service';
import { EventVoterModule } from '../event/voter';
import { VoterController } from './voter.controller';

@Module({
  imports: [forwardRef(() => EventVoterModule)],
  providers: [VoterService],
  controllers: [VoterController],
  exports: [VoterService],
})
export class VoterModule {}
