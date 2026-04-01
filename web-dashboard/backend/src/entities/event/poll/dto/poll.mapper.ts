import { Poll } from '@prisma/client';
import { PollResponseDto } from './poll.dto';

export const toPollResponseDto = (poll: Poll): PollResponseDto => {
  return {
    id: poll.id,
    name: poll.name,
    description: poll.description,
    status: poll.status,
    visibility: poll.visibility,
    isAutomatic: poll.isAutomatic,
    startAt: poll.startAt,
    endAt: poll.endAt,
    question: poll.question,
    options: poll.options,
    votes: poll.votes,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
  };

};

export const toPollResponseDtos = (polls: Poll[]): PollResponseDto[] => {
  return polls.map(toPollResponseDto);
};

export const toPollActionMessageResponseDto = (message: string) => {
  return { message };
};
