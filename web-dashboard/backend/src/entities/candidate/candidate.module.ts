import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { AdminAuthGuard, RolesGuard } from '../../shared/guards';
import { Reflector } from '@nestjs/core';
import { AdminModule } from '../admin';

@Module({
  imports: [
    AdminModule,
  ],
  controllers: [CandidateController],
  providers: [CandidateService, AdminAuthGuard, RolesGuard, Reflector],
  exports: [CandidateService],
})
export class CandidateModule { }
