// Shared types and interfaces for admin dashboard

export type EventStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type EventVisibility = 'public' | 'private';
export type EventType = 'election' | 'poll';
export type AdminRole = 'SUPER_ADMIN' | 'ELECTION_ADMIN' | 'POLL_ADMIN';
export type SelfNominationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUEST_INFO';

export type SelfNominationFilterStatus = 'ALL' | SelfNominationStatus;

export interface ManagerProps {
  role: AdminRole | null;
}

export interface Election {
  id: string;
  name: string;
  description?: string;
  status: EventStatus;
  visibility: EventVisibility;
  isAutomatic: boolean;
  startAt?: number;
  endAt?: number;
  candidateIds: string[];
  allowSelfNomination: boolean;
  voterListFinalized: boolean;
  votes: Record<string, number>;
  createdAt: string;
  updatedAt: string;

  admins: Admin[];
}

export interface Poll {
  id: string;
  name: string;
  description?: string;
  status: EventStatus;
  visibility: EventVisibility;
  isAutomatic: boolean;
  startAt?: number;
  endAt?: number;
  question: string;
  options: string[];
  votes: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Voter {
  id: string;
  studentId: string;
  walletAddress: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  studentId: string;
  name: string;
  bio?: string;
  walletAddress: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  name: string;
  role: AdminRole;
  walletAddress: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ElectionAdmin {
  id: string;
  electionId: string;
  adminId: string;
  createdAt: string;

  admin: Admin;
}

export interface EventVoter {
  id: string;
  voterId: string;
  eventId: string;
  createdAt: string;

  voter: Voter;
}

export interface ElectionFormData {
  name: string;
  description: string;
  visibility: EventVisibility;
  isAutomatic: boolean;
  startAt: string;
  endAt: string;
  allowSelfNomination: boolean;
  voterListFinalized: boolean;
  candidateIds: string[];
}

export interface PollFormData {
  name: string;
  description: string;
  question: string;
  options: string;
  visibility: EventVisibility;
  isAutomatic: boolean;
  startAt: string;
  endAt: string;
}

export interface VoterFormData {
  studentId: string;
  walletAddress: string;
  name: string;
  email: string;
}

export interface CandidateFormData {
  studentId: string;
  name: string;
  bio: string;
  walletAddress: string;
}

export interface SelfNomination {
  id: string;
  status: SelfNominationStatus;
  electionId: string;

  candidate: Candidate;
  election: Election;
  admin?: Admin;
  introduction?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
