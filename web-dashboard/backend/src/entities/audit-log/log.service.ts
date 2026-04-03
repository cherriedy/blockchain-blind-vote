import { Injectable } from "@nestjs/common";
import { prisma } from "prisma/prisma.service";

@Injectable()
export class AuditLogService {
    async getAll(search?: string) {
        const logs = await prisma.auditLog.findMany({
            where: search
                ? {
                    OR: [
                        { action: { contains: search, mode: 'insensitive' } },
                        { targetType: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {},
            include: { admin: true },
            orderBy: { createdAt: 'desc' },
        });

        // Duyệt qua từng log để lấy thông tin Election hoặc Poll
        const logsWithDetails = await Promise.all(
            logs.map(async (log) => {
                let targetData = null;

                if (log.targetType === 'ELECTION') {
                    targetData = await prisma.election.findUnique({
                        where: { id: log.targetId },
                        select: { name: true }
                    });
                } else if (log.targetType === 'POLL') {
                    targetData = await prisma.poll.findUnique({
                        where: { id: log.targetId },
                        select: { name: true }
                    });
                }

                return {
                    ...log,
                    targetName: targetData?.name || 'Đã bị xóa hoặc không tồn tại'
                };
            })
        );

        return logsWithDetails;
    }
}