/**
 * Trạng thái của sự kiện bỏ phiếu
 *
 * @enum {string}
 * @property {string} PENDING Đang chờ
 * @property {string} ACTIVE Đang diễn ra
 * @property {string} COMPLETED Đã hoàn thành
 * @property {string} CANCELLED Đã hủy
 */
export enum VotingEventStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
