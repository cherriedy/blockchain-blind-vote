import { Module } from '@nestjs/common';
import { ElectionService } from 'src/entities';
import { MailService } from './mail.service';

@Module({
  providers: [ElectionService, MailService],
  exports: [MailService],
})
export class ElectionModule {}
