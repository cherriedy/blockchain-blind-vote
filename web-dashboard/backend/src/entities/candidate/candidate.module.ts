import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { PrivilegedAuthGuard } from '../../shared/gurads';
import { Reflector } from '@nestjs/core';

@Module({
  controllers: [CandidateController],
  providers: [CandidateService, PrivilegedAuthGuard, Reflector],
  exports: [CandidateService],
})
export class CandidateModule {}
