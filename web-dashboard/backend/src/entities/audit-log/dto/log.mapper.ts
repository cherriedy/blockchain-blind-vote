import { AuditLog, Prisma } from '@prisma/client';
import { AuditLogResponseDto } from './log.dto';
import { toAdminResponseDto } from 'src/entities/admin';
import { toElectionResponseDto, toPollResponseDto } from 'src/entities/event';

type AuditLogWithTargetName = Prisma.AuditLogGetPayload<{
  include: { admin?: true };
}> & {
  targetName: string;
};

export function toAuditLogResponseDtos(
  logs: AuditLogWithTargetName[],
): AuditLogResponseDto[] {
  return logs.map((log) => ({
    id: log.id,
    adminId: log.adminId,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    details: log.details,
    createdAt: log.createdAt,

    admin: log.admin ? toAdminResponseDto(log.admin) : undefined,

    targetName: log.targetName,
  }));
}

export const toAuditLogResponseDto = (log: any): AuditLogResponseDto => ({
  id: log.id,
  adminId: log.adminId,
  action: log.action,
  targetType: log.targetType,
  targetId: log.targetId,
  details: log.details,
  createdAt: log.createdAt,
  targetName: log.targetName || 'Unknown',
});
