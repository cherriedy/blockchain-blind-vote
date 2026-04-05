import publicApi from "@/lib/publicApi";

export const authService = {
  createEligibilityChallenge: (
    studentId: string,
    walletAddress: string,
    voteType?: string,
    voteId?: string,
  ) =>
    publicApi.post("/auth/challenge", {
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
    publicApi.post("/auth/verify-challenge", {
      studentId,
      walletAddress,
      signature,
      voteType,
      voteId,
    }),
};

export default authService;
