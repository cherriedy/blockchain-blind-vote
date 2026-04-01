import { EventVoter, Voter } from '@prisma/client';
import { EventVoterResponseDto } from '../../election';
import { toVoterResponseDto } from 'src/entities/voter';

export type EventVoterWithVoter = EventVoter & {
  voter?: Voter;
};

export const toEventVoterResponseDto = (
  eventVoter: EventVoterWithVoter,
): EventVoterResponseDto => {
  return {
    id: eventVoter.id,
    voterId: eventVoter.voterId,
    voteType: eventVoter.voteType,
    voteId: eventVoter.voteId,
    canVote: eventVoter.canVote,
    createdAt: eventVoter.createdAt,
    updatedAt: eventVoter.updatedAt,

    voter: eventVoter.voter ? toVoterResponseDto(eventVoter.voter) : undefined
  };
};

export const toEventVoterResponseDtos = (
  eventVoters: EventVoter[],
): EventVoterResponseDto[] => {
  return eventVoters.map(toEventVoterResponseDto);
};
