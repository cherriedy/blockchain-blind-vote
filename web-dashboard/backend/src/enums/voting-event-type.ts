/**
 * Enum cho các loại sự kiện bỏ phiếu, dùng để phân biệt các loại sự kiện
 * bỏ phiếu khác nhau trong hệ thống.
 *
 * @enum {string}
 * @property {string} POLL - Sự kiện bỏ phiếu dạng khảo sát.
 * @property {string} ELECTION - Sự kiện bỏ phiếu dạng bầu cử.
 */
export enum VotingEventType {
  POLL = 'poll',
  ELECTION = 'election',
}
