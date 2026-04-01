import { Voter } from '@prisma/client';

export interface VoterResponseDto {
  id: string;
  studentId: string;
  walletAddress: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const toVoterResponseDto = (voter: Voter): VoterResponseDto => {
  return {
    id: voter.id,
    studentId: voter.studentId,
    walletAddress: voter.walletAddress,
    name: voter.name,
    isActive: voter.isActive,
    createdAt: voter.createdAt,
    updatedAt: voter.updatedAt,
  };
};

export const toVoterResponseDtos = (voters: Voter[]): VoterResponseDto[] => {
  return voters.map(toVoterResponseDto);
};

export const toVoterActionMessageResponseDto = (message: string) => {
  return { message };
};
