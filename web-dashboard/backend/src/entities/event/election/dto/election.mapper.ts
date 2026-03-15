import { Candidate, Election } from '@prisma/client';
import {
  ElectionResponseDto,
  ElectionCandidateResponseDto,
  ElectionCandidatesResponseDto,
  ActionMessageResponseDto,
} from './election.dto';

export const toElectionResponseDto = (
  election: Election,
): ElectionResponseDto => ({
  id: election.id,
  name: election.name,
  description: election.description,
  status: election.status,
  visibility: election.visibility,
  isAutomatic: election.isAutomatic,
  startAt: election.startAt,
  endAt: election.endAt,
  candidateIds: election.candidateIds,
  allowSelfNomination: election.allowSelfNomination,
  selfNominatedCandidates: election.selfNominatedCandidates,
  votes: election.votes as Record<string, number>,
  createdAt: election.createdAt,
  updatedAt: election.updatedAt,
});

export const toElectionResponseDtos = (
  elections: Election[],
): ElectionResponseDto[] => elections.map(toElectionResponseDto);

export const toElectionCandidateResponseDto = (
  candidate: Candidate,
): ElectionCandidateResponseDto => ({
  id: candidate.id,
  studentId: candidate.studentId,
  name: candidate.name,
  bio: candidate.bio,
  avatarUrl: candidate.avatarUrl,
  walletAddress: candidate.walletAddress,
  createdAt: candidate.createdAt,
  updatedAt: candidate.updatedAt,
});

export const toElectionCandidatesResponseDto = (candidates: {
  assigned: Candidate[];
  selfNominated: Candidate[];
}): ElectionCandidatesResponseDto => ({
  assigned: candidates.assigned.map(toElectionCandidateResponseDto),
  selfNominated: candidates.selfNominated.map(toElectionCandidateResponseDto),
});

export const toActionMessageResponseDto = (
  message: string,
): ActionMessageResponseDto => ({
  message,
});
