import api from '@/lib/api';

export const authService = {
  createEligibilityChallenge: (
    studentId: string,
    walletAddress: string,
    voteType?: string,
    voteId?: string,
  ) =>
    api.post('/auth/challenge', {
      studentId,
      walletAddress,
      voteType,
      voteId,
    }),

  verifyEligibilitySignature: (
    studentId: string,
    walletAddress: string,
    signature: string,
    voteType?: string,
    voteId?: string,
  ) =>
    api.post('/auth/verify-challenge', {
      studentId,
      walletAddress,
      signature,
      voteType,
      voteId,
    }),

  logout: (studentId: string, walletAddress: string) =>
    api.post('/auth/logout', { studentId, walletAddress }),
};

export default authService;
