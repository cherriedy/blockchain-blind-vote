import { SetMetadata } from '@nestjs/common';

export const MANAGED_ELECTION_KEY = 'managedElection';

/**
 * Decorator để guard biết cần kiểm tra quyền quản lý election.
 * @param param 'id' ở URL param để lấy electionId (mặc định 'id')
 */
export const ManagedElection = (param: string = 'id') =>
    SetMetadata(MANAGED_ELECTION_KEY, param);