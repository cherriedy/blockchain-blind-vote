import { SetMetadata } from '@nestjs/common';

export const MANAGED_POLL_KEY = 'managedPoll';

/**
 * Decorator để guard biết cần kiểm tra quyền quản lý poll.
 * @param param 'id' ở URL param để lấy pollId (mặc định 'id')
 */
export const ManagedPoll = (param: string = 'id') => 
  SetMetadata(MANAGED_POLL_KEY, param);