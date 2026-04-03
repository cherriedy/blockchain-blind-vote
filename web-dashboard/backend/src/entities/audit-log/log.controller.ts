import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuditLogService } from "./log.service";
import { toAuditLogResponseDtos } from "./dto/log.mapper";
import { AuditLogResponseDto } from "./dto/log.dto";

@ApiTags('Audit Log')
@Controller('audit-logs')
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    @ApiOperation({ summary: 'Get all audit logs' })
    @ApiResponse({
        status: 200,
        description: 'List of audit logs.',
        type: AuditLogResponseDto,
        isArray: true,
    })
    async getAllAuditLogs(
        @Query('search') search?: string,
    ): Promise<AuditLogResponseDto[]> {
        const logs = await this.auditLogService.getAll(search);
        return toAuditLogResponseDtos(logs);
    }
}