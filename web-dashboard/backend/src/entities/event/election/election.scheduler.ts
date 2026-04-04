import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class ElectionScheduler {
  @Cron(CronExpression.EVERY_30_SECONDS) // chạy mỗi 30s
  async updateElectionStatus() {
    const now = Date.now();

    const elections = await prisma.election.findMany({
      where: {
        isAutomatic: true,
      },
    });

    for (const e of elections) {
      // Bỏ qua nếu status là cancelled
      if (e.status === 'cancelled') continue;

      let newStatus = e.status;
      let voterListFinalizedUpdate = e.voterListFinalized;

      // Tính trạng thái mới
      if (e.startAt && now < e.startAt) {
        newStatus = 'pending';
      } else if (e.startAt && e.endAt && now >= e.startAt && now <= e.endAt) {
        newStatus = 'active';
        voterListFinalizedUpdate = true;
      } else if (e.endAt && now > e.endAt) {
        newStatus = 'completed';
      }

      // Cập nhật nếu có thay đổi
      if (
        newStatus !== e.status ||
        voterListFinalizedUpdate !== e.voterListFinalized
      ) {
        await prisma.election.update({
          where: { id: e.id },
          data: {
            status: newStatus,
            voterListFinalized: voterListFinalizedUpdate,
          },
        });

        console.log(
          `Updated election ${e.id} → status: ${newStatus}, voterListFinalized: ${voterListFinalizedUpdate}`,
        );
      }
    }
  }
}
