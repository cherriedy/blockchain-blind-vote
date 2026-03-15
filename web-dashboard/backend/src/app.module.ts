import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { VotingModule } from './voting';
import { EntitiesModule } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EntitiesModule,
    VotingModule,
  ],
})
export class AppModule {}
