import { Global, Module } from '@nestjs/common';
import { VotingContextService } from './voting-context.service';

@Global()
@Module({
  providers: [VotingContextService],
  exports: [VotingContextService],
})
export class VotingContextModule {}
