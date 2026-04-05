import {
  AuditLog,
  Candidate,
  Election,
  Prisma,
  SelfNomination,
} from '@prisma/client';
import {
  ElectionResponseDto,
  ElectionCandidateResponseDto,
  ElectionCandidatesResponseDto,
  ActionMessageResponseDto,
  SelfNominationResponseDto,
} from './election.dto';
import { toCandidateResponseDto } from 'src/entities/candidate';
import { toAdminResponseDto } from 'src/entities/admin';
import { AuditLogResponseDto } from 'src/entities/audit-log/dto/log.dto';

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
  voterListFinalized: election.voterListFinalized,
  votes: (election.votes || {}) as Record<string, number>,
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

type SelfNominationWithCandidate = Prisma.SelfNominationGetPayload<{
  include: { candidate: true; admin?: true; election: true };
}>;

export const toSelfNominationResponseDto = (
  selfNomination: SelfNominationWithCandidate,
): SelfNominationResponseDto => ({
  id: selfNomination.id,
  electionId: selfNomination.electionId,
  candidateId: selfNomination.candidateId,
  status: selfNomination.status,
  introduction: selfNomination.introduction,
  adminNotes: selfNomination.adminNotes,
  createdAt: selfNomination.createdAt,
  updatedAt: selfNomination.updatedAt,

  candidate: toCandidateResponseDto(selfNomination.candidate),
  admin: selfNomination.admin
    ? toAdminResponseDto(selfNomination.admin)
    : undefined,
  election: toElectionResponseDto(selfNomination.election),
});
