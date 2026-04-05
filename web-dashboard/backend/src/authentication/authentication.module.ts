import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { EligibilityModule } from '../eligibility';

@Module({
  imports: [EligibilityModule],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
