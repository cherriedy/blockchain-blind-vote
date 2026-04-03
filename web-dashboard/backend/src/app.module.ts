import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VotingModule } from './voting';
import { AdminModule, EntitiesModule } from './entities';
import { APP_GUARD } from '@nestjs/core';
import { AdminAuthGuard, RolesGuard } from './shared/guards';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EntitiesModule,
    VotingModule,
    AdminModule,
    ScheduleModule.forRoot()
  ],
  providers: [
    { provide: APP_GUARD, useClass: AdminAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
