import { Module } from "@nestjs/common";
import { AdminModule } from "../admin";
import { AuditLogController } from "./log.controller";
import { AuditLogService } from "./log.service";
import { AdminAuthGuard, RolesGuard } from "src/shared/guards";
import { Reflector } from "@nestjs/core";

@Module({
  imports: [
    AdminModule,
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService, AdminAuthGuard, RolesGuard, Reflector],
  exports: [AuditLogService],
})
export class AuditLogModule { }