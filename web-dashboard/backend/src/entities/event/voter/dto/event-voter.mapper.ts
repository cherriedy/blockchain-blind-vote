import { EventVoter } from '@prisma/client';
import { EventVoterResponseDto } from '../../election';

export const toEventVoterResponseDto = (
  eventVoter: EventVoter,
): EventVoterResponseDto => {
  return {
    id: eventVoter.id,
    voterId: eventVoter.voterId,
    voteType: eventVoter.voteType,
    voteId: eventVoter.voteId,
    canVote: eventVoter.canVote,
    createdAt: eventVoter.createdAt,
    updatedAt: eventVoter.updatedAt,
  };
};

export const toEventVoterResponseDtos = (
  eventVoters: EventVoter[],
): EventVoterResponseDto[] => {
  return eventVoters.map(toEventVoterResponseDto);
};
