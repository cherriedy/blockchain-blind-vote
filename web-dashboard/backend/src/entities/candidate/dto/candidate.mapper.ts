import { Candidate } from '@prisma/client';
import { CandidateResponseDto } from './candidate.dto';

export const toCandidateResponseDto = (
  candidate: Candidate,
): CandidateResponseDto => {
  return {
    id: candidate.id,
    studentId: candidate.studentId,
    name: candidate.name,
    bio: candidate.bio,
    avatarUrl: candidate.avatarUrl,
    walletAddress: candidate.walletAddress,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
};

export const toCandidateResponseDtos = (
  candidates: Candidate[],
): CandidateResponseDto[] => {
  return candidates.map(toCandidateResponseDto);
};
