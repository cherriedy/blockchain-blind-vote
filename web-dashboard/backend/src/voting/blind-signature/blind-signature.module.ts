import { Module } from '@nestjs/common';
import { BlindRsaService } from './blind-rsa.service';

@Module({
  providers: [BlindRsaService],
  exports: [BlindRsaService],
})
export class BlindSignatureModule {}
