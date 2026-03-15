export interface VoteUpdatePayload {
  voteType: string;
  voteId: string;
  candidateId?: string;
  optionIndex?: number;
  newTotal: number;
}
